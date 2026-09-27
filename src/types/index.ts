export interface VisitingCard {
  id: string;
  serverId?: string;
  personName: string;
  companyName: string;
  jobTitle?: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  whatsappNumber?: string;
  address?: string;
  city?: string;
  country?: string;
  website?: string;
  industry:
    | "Technology"
    | "Finance"
    | "Automotive"
    | "Healthcare"
    | "Real Estate"
    | "Other";
  notes?: string;
  rawOcrText?: string;
  cardImageUri: string;
  backImageUri?: string;
  thumbnailUri?: string;
  syncStatus?: 'pending' | 'synced' | 'failed';
  createdTimestamp: number;
  updatedTimestamp?: number;
}

export interface UserPersonalCard {
  id: string;
  companyName: string;
  fullName: string;
  designation: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  whatsappNumber?: string;
  address?: string;
  city?: string;
  country?: string;
  website?: string;
  industry?: string;
  profilePhotoUri?: string;
  frontImageUri?: string;
  backImageUri?: string;
  fileUri?: string;
  fileType?: "png" | "pdf";
  additionalDetails: Record<string, string>;
  isActive?: boolean;
  createdTimestamp: number;
  updatedTimestamp: number;
}

export interface UserProfile {
  id: string;
  xencardId: string;
  fullName: string;
  designation: string;
  dateOfBirth: string;
  cardLimit: number;
  referralCode: string;
  referredBy?: string;
  createdTimestamp: number;
  updatedTimestamp: number;
}

export interface Referral {
  id: string;
  referrerId: string;
  referredUserId: string;
  referralCode: string;
  confirmed: boolean;
  cardLimitIncrease: number;
  createdTimestamp: number;
  confirmedTimestamp?: number;
}

export type Industry =
  | "Technology"
  | "Finance"
  | "Automotive"
  | "Healthcare"
  | "Real Estate"
  | "Other";

export type XeniIntent =
  | {
      type: "SEARCH";
      query?: string;
      personName?: string;
      companyName?: string;
      industry?: string;
    }
  | {
      type: "CALL";
      contactId: string;
    }
  | {
      type: "WHATSAPP";
      contactId: string;
    }
  | {
      type: "EMAIL";
      contactId: string;
    }
  | {
      type: "MAPS";
      contactId: string;
    }
  | {
      type: "UNKNOWN";
    };
