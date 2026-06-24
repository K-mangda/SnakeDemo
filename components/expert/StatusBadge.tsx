import Badge from '@/components/ui/Badge'
import { CheckCircle2, Clock, HelpCircle, PlusCircle } from 'lucide-react'

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const baseClass = "w-[110px] flex justify-center whitespace-nowrap"
  switch (status) {
    case 'pending':               return <Badge className={baseClass} variant="warning"><Clock size={12} className="mr-1" />Pending</Badge>
    case 'verified':              return <Badge className={baseClass} variant="success"><CheckCircle2 size={12} className="mr-1" />Verified</Badge>
    case 'unclear':               return <Badge className={baseClass} variant="destructive"><HelpCircle size={12} className="mr-1 shrink-0" />Unclear</Badge>
    case 'waiting_for_new_class': return <Badge className={baseClass} variant="default"><PlusCircle size={12} className="mr-1 shrink-0" />New Class</Badge>
    default:                      return <Badge className={baseClass}>{status}</Badge>
  }
}
