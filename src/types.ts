export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  familyId: string | null;
  photoURL: string | null;
}

export interface Family {
  id: string;
  name: string;
  inviteCode: string;
  members: string[];
  createdAt: unknown;
}

export interface ShoppingItem {
  id: string;
  name: string;
  purchased: boolean;
  priceEstimate: number;
  addedBy: string;
  createdAt: unknown;
}
