import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"

export interface MigrateOrDeleteDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  title: string
  itemName: string
  items: { id: string; name: string }[]
  onDelete: () => Promise<void>
  onMigrate: (targetId: string) => Promise<void>
}

export function MigrateOrDeleteDialog({
  isOpen,
  onOpenChange,
  title,
  itemName,
  items,
  onDelete,
  onMigrate,
}: MigrateOrDeleteDialogProps) {
  const [action, setAction] = useState<'delete' | 'migrate'>('delete')
  const [targetId, setTargetId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (action === 'migrate' && !targetId) return

    setIsLoading(true)
    try {
      if (action === 'delete') {
        await onDelete()
      } else {
        await onMigrate(targetId)
      }
      onOpenChange(false)
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            You are about to remove <strong>{itemName}</strong>. This item may be used by apps or screens. How would you like to handle its associations?
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="py-4">
          <RadioGroup value={action} onValueChange={(val) => setAction(val as 'delete' | 'migrate')} className="space-y-4">
            <div className="flex items-start space-x-3">
              <RadioGroupItem value="delete" id="delete" className="mt-1" />
              <Label htmlFor="delete" className="flex flex-col cursor-pointer">
                <span className="font-semibold text-destructive">Delete permanently</span>
                <span className="font-normal text-muted-foreground text-sm mt-1">
                  Remove this item and all its associations. This cannot be undone.
                </span>
              </Label>
            </div>
            <div className="flex items-start space-x-3">
              <RadioGroupItem value="migrate" id="migrate" className="mt-1" />
              <Label htmlFor="migrate" className="flex flex-col cursor-pointer w-full">
                <span className="font-semibold">Migrate and delete</span>
                <span className="font-normal text-muted-foreground text-sm mt-1 mb-3">
                  Move all associated apps/screens to another item before deleting.
                </span>
                {action === 'migrate' && (
                  <Select value={targetId} onValueChange={setTargetId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select target to migrate to..." />
                    </SelectTrigger>
                    <SelectContent>
                      {items.map(item => (
                        <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </Label>
            </div>
          </RadioGroup>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <Button 
            variant={action === 'delete' ? 'destructive' : 'default'}
            disabled={isLoading || (action === 'migrate' && !targetId)}
            onClick={handleConfirm}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
