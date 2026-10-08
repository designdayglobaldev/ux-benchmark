import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { DownloadCloud, Loader2, AlertTriangle } from 'lucide-react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction } from '@/components/ui/alert-dialog';

export function ImportMobbinModal({ isConnected, onImportSuccess }: { isConnected: boolean, onImportSuccess: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showTokenError, setShowTokenError] = useState(false);
  const [query, setQuery] = useState('');
  const [platform, setPlatform] = useState('web');
  const [searchType, setSearchType] = useState('flow');
  const [appId, setAppId] = useState('');
  const [flowId, setFlowId] = useState('');
  
  const [apps, setApps] = useState<any[]>([]);
  const [flows, setFlows] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetch(`${import.meta.env.VITE_API_URL || ''}/api/v1/apps?lite=true`)
        .then(res => res.json())
        .then(setApps)
        .catch(console.error);
        
      fetch(`${import.meta.env.VITE_API_URL || ''}/api/v1/flows?lite=true`)
        .then(res => res.json())
        .then(setFlows)
        .catch(console.error);
    }
  }, [isOpen]);

  const handleImport = async () => {
    if (!query) return toast.error("Please enter a search query");
    if (!appId || !flowId) return toast.error("Please select an app and flow");

    setIsLoading(true);
    toast.loading("Searching and importing from Mobbin...");

    try {
      // First, get the screens from Mobbin
      const searchRes = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/v1/mobbin/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, platform, searchType, limit: 10, appId, flowId })
      });
      
      if (!searchRes.ok) {
        const errData = await searchRes.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to search Mobbin");
      }
      const searchData = await searchRes.json();
      
      toast.dismiss();
      toast.success(`Successfully imported ${searchData.count || 0} screens from Mobbin!`);
      
      setIsOpen(false);
      onImportSuccess();
    } catch (error: any) {
      toast.dismiss();
      if (error.message && error.message.includes("Claude AI credits expired")) {
        setIsOpen(false);
        setShowTokenError(true);
      } else {
        toast.error(error.message || 'Import failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) return null;

  return (
    <>
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="ml-2 bg-indigo-600 hover:bg-indigo-700 text-white">
          <DownloadCloud className="w-4 h-4 mr-2" />
          Import from Mobbin
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Screens from Mobbin</DialogTitle>
          <DialogDescription>
            Search for screens on Mobbin and automatically import them into your app.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Search Type</Label>
            <Select value={searchType} onValueChange={setSearchType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="screen">Individual Screens</SelectItem>
                <SelectItem value="flow">Full Flow (Recommended)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Search Query</Label>
            <Input placeholder="e.g. Spotify setting up an account" value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Platform</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="web">Web</SelectItem>
                <SelectItem value="ios">iOS</SelectItem>
                <SelectItem value="android">Android</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Assign to App</Label>
            <Select value={appId} onValueChange={setAppId}>
              <SelectTrigger><SelectValue placeholder="Select App..." /></SelectTrigger>
              <SelectContent>
                {apps.map(app => (
                  <SelectItem key={app.id} value={app.id}>{app.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Assign to Flow</Label>
            <Select value={flowId} onValueChange={setFlowId}>
              <SelectTrigger><SelectValue placeholder="Select Flow..." /></SelectTrigger>
              <SelectContent>
                {flows.map(flow => (
                  <SelectItem key={flow.id} value={flow.id}>{flow.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleImport} disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700">
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Start Import
          </Button>
        </div>
      </DialogContent>
    </Dialog>

      <AlertDialog open={showTokenError} onOpenChange={setShowTokenError}>
        <AlertDialogContent className="border-red-500 bg-red-50">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-red-700">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Claude AI Credits Expired!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-red-900 mt-2 font-medium text-md">
              Your Anthropic API key has run out of credits or has expired. Please log into your Anthropic console and recharge your balance before uploading more screens.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={() => setShowTokenError(false)}>
              I Understand
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
