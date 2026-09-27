import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { type User } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'

export const usersColumns: ColumnDef<User>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all'
        className='translate-y-0.5'
      />
    ),
    meta: {
      className: cn('inset-s-0 z-10 rounded-tl-[inherit] max-md:sticky'),
    },
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Select row'
        className='translate-y-0.5'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Email' />
    ),
    cell: ({ row }) => (
      <div className='w-fit ps-2 font-medium'>{row.getValue('email')}</div>
    ),
  },
  {
    accessorKey: 'tier',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='AI Tier' />
    ),
    cell: ({ row }) => {
      const tier = row.getValue('tier') as string
      const isPremium = tier === 'PREMIUM'
      return (
        <Badge variant={isPremium ? 'default' : 'outline'} className={cn(isPremium && "bg-amber-500 hover:bg-amber-600 text-white")}>
          {tier}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    id: 'usage',
    header: 'Current Month Usage',
    cell: ({ row }) => {
      const usages = row.original.usages || []
      const usage = usages.length > 0 ? usages[0].promptsUsed : 0
      return <div className="ps-2">{usage} prompts used</div>
    },
  },
  {
    id: 'actions',
    cell: DataTableRowActions,
  },
]
