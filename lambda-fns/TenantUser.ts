interface TenantUser {
  id: string;
  dateCreatedAt: string
  name: string
  nameTwo: string
  emailVerified: string
  inviteInfo: string
  dateTenantLogIn: string
  dateTenantLogOut: string
  state: string
  access: string
};

export = TenantUser;