import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import { qrService } from '../qr/qrService';

class SharingService {
  async shareXencardId(xencardId: string): Promise<void> {
    try {
      await Sharing.shareAsync(xencardId, {
        mimeType: 'text/plain',
        dialogTitle: 'Share Xencard ID',
      });
    } catch (error) {
      console.error('Share error:', error);
      throw error;
    }
  }

  async shareProfileLink(xencardId: string): Promise<void> {
    try {
      const link = qrService.generateShareLink('profile', xencardId);
      await Sharing.shareAsync(link, {
        mimeType: 'text/plain',
        dialogTitle: 'Share Profile Link',
      });
    } catch (error) {
      console.error('Share error:', error);
      throw error;
    }
  }

  async shareReferralLink(referralCode: string): Promise<void> {
    try {
      const link = qrService.generateShareLink('referral', referralCode);
      await Sharing.shareAsync(link, {
        mimeType: 'text/plain',
        dialogTitle: 'Share Referral Link',
      });
    } catch (error) {
      console.error('Share error:', error);
      throw error;
    }
  }

  async shareContactCard(contactData: any): Promise<void> {
    try {
      const vCard = this.generateVCard(contactData);
      const vCardPath = `${FileSystem.documentDirectory}contact.vcf`;
      await FileSystem.writeAsStringAsync(vCardPath, vCard);
      
      await Sharing.shareAsync(vCardPath, {
        mimeType: 'text/vcard',
        dialogTitle: 'Share Contact',
      });
    } catch (error) {
      console.error('Share error:', error);
      throw error;
    }
  }

  async sharePersonalCard(personalCardData: any): Promise<void> {
    try {
      const vCard = this.generateVCard(personalCardData);
      const vCardPath = `${FileSystem.documentDirectory}personal-card.vcf`;
      await FileSystem.writeAsStringAsync(vCardPath, vCard);
      
      await Sharing.shareAsync(vCardPath, {
        mimeType: 'text/vcard',
        dialogTitle: 'Share Personal Card',
      });
    } catch (error) {
      console.error('Share error:', error);
      throw error;
    }
  }

  async copyToClipboard(text: string): Promise<void> {
    try {
      await Clipboard.setStringAsync(text);
    } catch (error) {
      console.error('Clipboard error:', error);
      throw error;
    }
  }

  private generateVCard(data: any): string {
    const name = data.personName || data.fullName || '';
    const lines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${name}`,
      data.companyName || data.company ? `ORG:${data.companyName || data.company}` : '',
      data.jobTitle || data.designation ? `TITLE:${data.jobTitle || data.designation}` : '',
      data.phone ? `TEL;TYPE=WORK,VOICE:${data.phone}` : '',
      data.alternatePhone ? `TEL;TYPE=HOME,VOICE:${data.alternatePhone}` : '',
      data.whatsappNumber ? `TEL;TYPE=CELL:${data.whatsappNumber}` : '',
      data.email ? `EMAIL;TYPE=PREF,INTERNET:${data.email}` : '',
      data.website ? `URL:${data.website}` : '',
      data.address || data.city || data.country
        ? `ADR;TYPE=WORK:;;${data.address || ''};${data.city || ''};;${data.country || ''}`
        : '',
      data.notes ? `NOTE:${data.notes}` : '',
      'END:VCARD'
    ].filter(Boolean);
    
    return lines.join('\n');
  }
}

export const sharingService = new SharingService();
