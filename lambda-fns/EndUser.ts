interface EndUser {
  id: string;
  dateCreatedAt: string
  name: string
  email: string
  emailVerified: string
  phone: string
  isClientSendEmail: boolean
};

export = EndUser;