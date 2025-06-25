import { useState } from "react";
import { X, Copy, Share2, Check, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { Room } from "@shared/schema";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
}

export default function ShareModal({ isOpen, onClose, room }: ShareModalProps) {
  const [accessLevel, setAccessLevel] = useState("full");
  const [requireAuth, setRequireAuth] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const roomUrl = `${window.location.origin}/room/${room.name}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(roomUrl);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Room URL copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleShare = () => {
    toast({
      title: "Room Shared!",
      description: `Collaboration room "${room.name}" is ready for sharing`,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="panel-bg border-editor text-editor-primary max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-lg font-semibold">
            <Share2 className="w-5 h-5 mr-2 text-vscode-blue" />
            Share Collaboration Room
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="roomUrl" className="block text-sm font-medium mb-2">
              Room URL
            </Label>
            <div className="flex items-center space-x-2">
              <Input
                id="roomUrl"
                value={roomUrl}
                readOnly
                className="flex-1 bg-editor-bg border-editor text-editor-primary font-mono text-sm"
              />
              <Button
                onClick={copyToClipboard}
                size="sm"
                className="bg-vscode-blue hover:bg-blue-600"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          
          <div>
            <Label htmlFor="accessLevel" className="block text-sm font-medium mb-2">
              Access Level
            </Label>
            <Select value={accessLevel} onValueChange={setAccessLevel}>
              <SelectTrigger className="bg-editor-bg border-editor">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="panel-bg border-editor">
                <SelectItem value="full">Full Access (Read & Write)</SelectItem>
                <SelectItem value="read">Read Only</SelectItem>
                <SelectItem value="comment">Comment Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="requireAuth" 
              checked={requireAuth}
              onCheckedChange={setRequireAuth}
              className="border-editor"
            />
            <Label htmlFor="requireAuth" className="text-sm flex items-center">
              {requireAuth ? <Lock className="w-4 h-4 mr-1" /> : <Unlock className="w-4 h-4 mr-1" />}
              Require authentication to join
            </Label>
          </div>

          <div className="bg-editor-bg border border-editor rounded p-3">
            <h4 className="text-sm font-medium mb-2 text-editor-primary">Room Information</h4>
            <div className="space-y-1 text-xs text-editor-secondary">
              <div>Name: <span className="text-warning-yellow font-mono">{room.name}</span></div>
              <div>Language: <span className="text-blue-400">{room.language}</span></div>
              <div>Created: <span className="text-editor-primary">{new Date(room.createdAt).toLocaleDateString()}</span></div>
            </div>
          </div>
          
          <div className="flex items-center justify-end space-x-3 pt-4">
            <Button 
              variant="ghost" 
              onClick={onClose}
              className="text-editor-secondary hover:text-editor-primary"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleShare}
              className="bg-success-green hover:bg-green-600 text-white"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share Room
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
