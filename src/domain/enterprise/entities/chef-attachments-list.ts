import { WatchedList } from '@/core/entities/wawtched-list'
import { ChefAttachment } from './chef-attachment'

export class ChefAttachmentsList extends WatchedList<ChefAttachment> {
  compareItems(a: ChefAttachment, b: ChefAttachment): boolean {
    return a.attachmentId.equals(b.attachmentId)
  }
}
