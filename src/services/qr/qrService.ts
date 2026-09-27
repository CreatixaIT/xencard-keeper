export interface QRCodeOptions {
  size?: number;
  color?: string;
  backgroundColor?: string;
  logo?: string;
}

class QRService {
  generateXencardQRCodeData(xencardId: string): string {
    return `https://xeni.xentroinfotech.com/u/${xencardId}`;
  }

  generateProfileQRCodeData(xencardId: string): string {
    return `https://xeni.xentroinfotech.com/u/${xencardId}`;
  }

  generateReferralQRCodeData(referralCode: string): string {
    return `https://xeni.xentroinfotech.com/r/${referralCode}`;
  }

  generateContactShareQRCodeData(contactId: string): string {
    return `https://xeni.xentroinfotech.com/c/${contactId}`;
  }

  generateShareLink(type: 'profile' | 'referral' | 'contact', id: string): string {
    switch (type) {
      case 'profile':
        return `https://xeni.xentroinfotech.com/u/${id}`;
      case 'referral':
        return `https://xeni.xentroinfotech.com/r/${id}`;
      case 'contact':
        return `https://xeni.xentroinfotech.com/c/${id}`;
      default:
        return 'https://xeni.xentroinfotech.com';
    }
  }

  generateAppDownloadQRCodeData(): string {
    return 'https://xeni.xentroinfotech.com/xencard-keeper/download';
  }

  getAppDownloadUrl(): string {
    return 'https://xeni.xentroinfotech.com/xencard-keeper/download';
  }
}

export const qrService = new QRService();
