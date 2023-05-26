interface Project {
  id: string
  name: string
  serialNumber: string
  description: string
  dateCreatedAt: string
  valueUnitsA: string
  valueEstimA: number
  valueUnitsB: string
  valueEstimB: number
  dateEstimStart: string
  dateEstimEnd: string
  dateActionStart: string
  dateActionEnd: string
  index: string
  attachments: string
  children: string
};

export = Project;