interface Tenant {
  id: string;
  dateCreatedAt: string
  name: string
  dateTenantLogIn: string
  dateTenantLogOut: string
  state: string
}

export = Tenant;