import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { ApplicationStatus, OfferStatus, ContractStatus } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fi-FI', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('fi-FI', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('fi-FI', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function getStatusLabel(status: ApplicationStatus): string {
  const labels: Record<ApplicationStatus, string> = {
    DRAFT: 'Luonnos',
    SUBMITTED: 'Lähetetty',
    SUBMITTED_TO_FINANCIER: 'Käsittelyssä',
    INFO_REQUESTED: 'Lisätietopyyntö',
    OFFER_SENT: 'Tarjous saatavilla',
    OFFER_ACCEPTED: 'Tarjous hyväksytty',
    OFFER_REJECTED: 'Tarjous hylätty',
    CONTRACT_SENT: 'Sopimus lähetetty',
    SIGNED: 'Allekirjoitettu',
    CLOSED: 'Suljettu',
    CANCELLED: 'Peruutettu',
  };
  return labels[status] || status;
}

export function getStatusColor(status: ApplicationStatus): string {
  const colors: Record<ApplicationStatus, string> = {
    DRAFT: 'badge-gray',
    SUBMITTED: 'badge-blue',
    SUBMITTED_TO_FINANCIER: 'badge-blue',
    INFO_REQUESTED: 'badge-yellow',
    OFFER_SENT: 'badge-green',
    OFFER_ACCEPTED: 'badge-green',
    OFFER_REJECTED: 'badge-red',
    CONTRACT_SENT: 'badge-purple',
    SIGNED: 'badge-green',
    CLOSED: 'badge-gray',
    CANCELLED: 'badge-red',
  };
  return colors[status] || 'badge-gray';
}

export function getOfferStatusLabel(status: OfferStatus): string {
  const labels: Record<OfferStatus, string> = {
    DRAFT: 'Luonnos',
    PENDING_ADMIN: 'Odottaa hyväksyntää',
    SENT: 'Lähetetty asiakkaalle',
    ACCEPTED: 'Hyväksytty',
    REJECTED: 'Hylätty',
    EXPIRED: 'Vanhentunut',
  };
  return labels[status] || status;
}

export function getContractStatusLabel(status: ContractStatus): string {
  const labels: Record<ContractStatus, string> = {
    DRAFT: 'Luonnos',
    PENDING_ADMIN: 'Odottaa hyväksyntää',
    SENT: 'Lähetetty',
    SIGNED: 'Allekirjoitettu',
    REJECTED: 'Hylätty',
    EXPIRED: 'Vanhentunut',
  };
  return labels[status] || status;
}

export function getApplicationTypeLabel(type: 'LEASING' | 'SALE_LEASEBACK'): string {
  return type === 'LEASING' ? 'Leasing' : 'Sale-Leaseback';
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

