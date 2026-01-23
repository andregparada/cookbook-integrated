import { Entity } from '@/core/entities/entity'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'

export interface ChefAttachmentProps {
  chefId: UniqueEntityID
  attachmentId: UniqueEntityID
}

export class ChefAttachment extends Entity<ChefAttachmentProps> {
  get chefId() {
    return this.props.chefId
  }

  get attachmentId() {
    return this.props.attachmentId
  }

  static create(props: ChefAttachmentProps, id?: UniqueEntityID) {
    const chefAttachment = new ChefAttachment(props, id)
    return chefAttachment
  }
}
