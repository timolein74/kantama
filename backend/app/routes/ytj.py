"""
YTJ / PRH Avoindata API integration (v3)
Fetches company information from Finnish Patent and Registration Office
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
import httpx
import re

router = APIRouter()

# New v3 API endpoint
PRH_API_BASE = "https://avoindata.prh.fi/opendata-ytj-api/v3/companies"


def validate_business_id(business_id: str) -> bool:
    """Validate Finnish Y-tunnus format (1234567-8)"""
    pattern = r'^\d{7}-\d$'
    return bool(re.match(pattern, business_id))


@router.get("/search/by-name")
async def search_companies_by_name(
    name: str = Query(..., min_length=2, description="Company name to search"),
    limit: int = Query(10, ge=1, le=50, description="Maximum results to return")
):
    """
    Search companies by name from PRH Avoindata API v3
    
    Args:
        name: Company name to search (minimum 2 characters)
        limit: Maximum number of results (default 10)
    
    Returns:
        List of matching companies with business_id and name
    """
    if len(name.strip()) < 2:
        raise HTTPException(
            status_code=400,
            detail="Hakusanan täytyy olla vähintään 2 merkkiä"
        )
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                PRH_API_BASE,
                params={
                    "name": name.strip(),
                    "maxResults": limit
                }
            )
            
            response.raise_for_status()
            data = response.json()
            
            companies = data.get("companies", [])
            
            results = []
            for company in companies:
                # Get business ID - may be string or object with 'value' property
                business_id_raw = company.get("businessId")
                if not business_id_raw:
                    continue
                
                # Extract the actual business ID string
                if isinstance(business_id_raw, dict):
                    business_id = business_id_raw.get("value")
                else:
                    business_id = business_id_raw
                
                if not business_id:
                    continue
                
                # Get current name
                names = company.get("names", [])
                current_name = None
                for n in names:
                    if n.get("type") == "1" and not n.get("endDate"):
                        current_name = n.get("name")
                        break
                if not current_name and names:
                    current_name = names[0].get("name")
                
                if not current_name:
                    continue
                
                # Check status
                status = company.get("status")
                trade_register_status = company.get("tradeRegisterStatus")
                is_active = status in ["1", "2"] and trade_register_status == "1"
                
                # Check for liquidation
                company_situations = company.get("companySituations", [])
                is_liquidated = len(company_situations) > 0
                
                # Get company form
                company_forms = company.get("companyForms", [])
                company_form = None
                for form in company_forms:
                    if not form.get("endDate"):
                        descriptions = form.get("descriptions", [])
                        for desc in descriptions:
                            if desc.get("languageCode") == "1":
                                company_form = desc.get("description")
                                break
                        break
                
                results.append({
                    "business_id": business_id,
                    "name": current_name,
                    "company_form": company_form,
                    "is_active": is_active and not is_liquidated,
                    "is_liquidated": is_liquidated
                })
            
            return {"results": results, "total": len(results)}
            
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="PRH-palvelu ei vastannut ajoissa. Yritä uudelleen."
        )
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=502,
            detail=f"Virhe haettaessa tietoja PRH:sta: {str(e)}"
        )


@router.get("/{business_id}")
async def get_company_info(business_id: str):
    """
    Fetch FULL company information from PRH Avoindata API v3
    
    Args:
        business_id: Finnish Y-tunnus (e.g., "1234567-8")
    
    Returns:
        Complete company information including all available data from YTJ
    """
    # Validate format
    if not validate_business_id(business_id):
        raise HTTPException(
            status_code=400, 
            detail="Virheellinen Y-tunnus. Käytä muotoa 1234567-8"
        )
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                PRH_API_BASE,
                params={"businessId": business_id}
            )
            
            if response.status_code == 404:
                raise HTTPException(
                    status_code=404,
                    detail="Yritystä ei löytynyt annetulla Y-tunnuksella"
                )
            
            response.raise_for_status()
            data = response.json()
            
            if not data.get("companies") or len(data["companies"]) == 0:
                raise HTTPException(
                    status_code=404,
                    detail="Yritystä ei löytynyt"
                )
            
            company = data["companies"][0]
            
            # === NAMES ===
            names = company.get("names", [])
            current_name = None
            all_names = []
            for name in names:
                name_entry = {
                    "name": name.get("name"),
                    "type": name.get("type"),
                    "start_date": name.get("startDate"),
                    "end_date": name.get("endDate"),
                }
                all_names.append(name_entry)
                if name.get("type") == "1" and not name.get("endDate"):
                    current_name = name.get("name")
            if not current_name and names:
                current_name = names[0].get("name")
            
            # === ADDRESSES ===
            addresses = company.get("addresses", [])
            visiting_address = None
            postal_address = None
            
            for addr in addresses:
                street = addr.get("street", "")
                if addr.get("buildingNumber"):
                    street += " " + addr.get("buildingNumber", "")
                
                post_code = addr.get("postCode")
                city = None
                post_offices = addr.get("postOffices", [])
                for po in post_offices:
                    if po.get("languageCode") == "1":
                        city = po.get("city")
                        break
                
                addr_obj = {
                    "street": street.strip() if street else None,
                    "postal_code": post_code,
                    "city": city,
                    "country": addr.get("country"),
                }
                
                if addr.get("type") == 1:
                    visiting_address = addr_obj
                elif addr.get("type") == 2:
                    postal_address = addr_obj
            
            # === COMPANY FORM ===
            company_forms = company.get("companyForms", [])
            company_form = None
            company_form_code = None
            for form in company_forms:
                if not form.get("endDate"):
                    company_form_code = form.get("type")
                    descriptions = form.get("descriptions", [])
                    for desc in descriptions:
                        if desc.get("languageCode") == "1":
                            company_form = desc.get("description")
                            break
                    break
            
            # === BUSINESS LINES ===
            main_business_line = company.get("mainBusinessLine", {})
            main_business = None
            main_business_code = None
            if main_business_line:
                main_business_code = main_business_line.get("code")
                descriptions = main_business_line.get("descriptions", [])
                for desc in descriptions:
                    if desc.get("languageCode") == "1":
                        main_business = desc.get("description")
                        break
            
            # All business lines
            business_lines = []
            for bl in company.get("businessLines", []):
                bl_code = bl.get("code")
                bl_desc = None
                for desc in bl.get("descriptions", []):
                    if desc.get("languageCode") == "1":
                        bl_desc = desc.get("description")
                        break
                business_lines.append({
                    "code": bl_code,
                    "description": bl_desc,
                    "start_date": bl.get("startDate"),
                    "end_date": bl.get("endDate"),
                })
            
            # === CONTACT INFO ===
            contact_details = company.get("contactDetails", [])
            phone = None
            website = None
            email = None
            
            for contact in contact_details:
                contact_type = contact.get("type")
                if contact_type == "1" and not phone:  # Phone
                    phone = contact.get("value")
                elif contact_type == "2" and not website:  # Website
                    website = contact.get("value")
                elif contact_type == "3" and not email:  # Email
                    email = contact.get("value")
            
            # === REGISTERED ENTRIES ===
            registered_entries = company.get("registeredEntries", [])
            register_info = []
            for entry in registered_entries:
                entry_desc = None
                for desc in entry.get("descriptions", []):
                    if desc.get("languageCode") == "1":
                        entry_desc = desc.get("description")
                        break
                register_info.append({
                    "register": entry.get("register"),
                    "status": entry.get("status"),
                    "description": entry_desc,
                    "date": entry.get("date"),
                })
            
            # === COMPANY SITUATIONS (liquidation, bankruptcy etc.) ===
            company_situations = company.get("companySituations", [])
            situations = []
            for sit in company_situations:
                sit_desc = None
                for desc in sit.get("descriptions", []):
                    if desc.get("languageCode") == "1":
                        sit_desc = desc.get("description")
                        break
                situations.append({
                    "type": sit.get("type"),
                    "description": sit_desc,
                    "start_date": sit.get("startDate"),
                    "end_date": sit.get("endDate"),
                })
            
            # === STATUS ===
            status = company.get("status")
            trade_register_status = company.get("tradeRegisterStatus")
            is_active = status in ["1", "2"] and trade_register_status == "1"
            is_liquidated = len(company_situations) > 0
            
            # === DATES ===
            registration_date = company.get("registrationDate")
            end_date = company.get("endDate")
            
            return {
                # Basic info
                "business_id": business_id,
                "name": current_name,
                "all_names": all_names,
                
                # Addresses
                "visiting_address": visiting_address,
                "postal_address": postal_address,
                # Legacy fields for backwards compatibility
                "street_address": visiting_address.get("street") if visiting_address else (postal_address.get("street") if postal_address else None),
                "postal_code": visiting_address.get("postal_code") if visiting_address else (postal_address.get("postal_code") if postal_address else None),
                "city": visiting_address.get("city") if visiting_address else (postal_address.get("city") if postal_address else None),
                
                # Company form
                "company_form": company_form,
                "company_form_code": company_form_code,
                
                # Business
                "main_business": main_business,
                "main_business_code": main_business_code,
                "business_lines": business_lines,
                
                # Contact info
                "phone": phone,
                "website": website,
                "email": email,
                
                # Register info
                "registered_entries": register_info,
                
                # Situations
                "company_situations": situations,
                
                # Status
                "status": status,
                "trade_register_status": trade_register_status,
                "is_active": is_active and not is_liquidated,
                "is_liquidated": is_liquidated,
                
                # Dates
                "registration_date": registration_date,
                "end_date": end_date,
            }
            
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="PRH-palvelu ei vastannut ajoissa. Yritä uudelleen."
        )
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=502,
            detail=f"Virhe haettaessa tietoja PRH:sta: {str(e)}"
        )

