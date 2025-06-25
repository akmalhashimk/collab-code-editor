import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  History, 
  Users, 
  Save, 
  MessageSquare, 
  Settings,
  Activity as ActivityIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Room, RoomParticipant, CodeVersion } from "@shared/schema";

interface ActivityPanelProps {
  room: Room;
  participants: Array<{ userId: string; username: string; color: string }>;
  onSaveVersion: () => void;
}

export default function ActivityPanel({ room, participants, onSaveVersion }: ActivityPanelProps) {
  const [activeTab, setActiveTab] = useState("activity");

  const { data: versions = [] } = useQuery<CodeVersion[]>({
    queryKey: [`/api/rooms/${room.id}/versions`],
    enabled: !!room.id,
  });

  const mockActivities = [
    {
      id: 1,
      user: "Alex Smith",
      action: "modified App.jsx",
      time: "2 minutes ago",
      type: "edit",
      details: "+3 lines, -1 line"
    },
    {
      id: 2,
      user: "Maya Kumar",
      action: "created TodoItem.jsx",
      time: "5 minutes ago",
      type: "create",
      details: "+45 lines"
    },
    {
      id: 3,
      user: "You",
      action: "saved project state",
      time: "8 minutes ago",
      type: "save",
      details: null
    }
  ];

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getUserColor = (name: string) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <aside className="w-80 panel-bg border-l border-editor flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
        <div className="border-b border-editor">
          <TabsList className="grid w-full grid-cols-3 bg-transparent h-auto">
            <TabsTrigger 
              value="activity" 
              className="py-3 px-4 text-sm font-medium data-[state=active]:bg-editor-bg data-[state=active]:border-b-2 data-[state=active]:border-vscode-blue"
            >
              Activity
            </TabsTrigger>
            <TabsTrigger 
              value="chat" 
              className="py-3 px-4 text-sm font-medium text-editor-secondary hover:text-editor-primary data-[state=active]:bg-editor-bg"
            >
              Chat
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="py-3 px-4 text-sm font-medium text-editor-secondary hover:text-editor-primary data-[state=active]:bg-editor-bg"
            >
              Settings
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="activity" className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full p-4">
            <div className="space-y-4">
              {/* Recent Activity */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center text-editor-primary">
                  <History className="w-4 h-4 mr-2 text-vscode-blue" />
                  Recent Activity
                </h3>
                
                <div className="space-y-3">
                  {mockActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 bg-editor-bg rounded">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                        style={{ backgroundColor: getUserColor(activity.user) }}
                      >
                        {getUserInitials(activity.user)}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-editor-primary">
                          <span className="font-medium">{activity.user}</span> {activity.action}
                        </div>
                        <div className="text-xs text-editor-secondary mt-1">{activity.time}</div>
                        {activity.details && (
                          <div className="text-xs text-success-green mt-1">{activity.details}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Connected Users */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center text-editor-primary">
                  <Users className="w-4 h-4 mr-2 text-success-green" />
                  Connected Users
                </h3>
                
                <div className="space-y-2">
                  {participants.slice(0, 5).map((participant) => (
                    <div key={participant.userId} className="flex items-center space-x-3 p-2 rounded hover:bg-editor-bg">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                        style={{ backgroundColor: participant.color }}
                      >
                        {getUserInitials(participant.username)}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-editor-primary">
                          {participant.username}
                          {participant.userId.includes('user') && " (You)"}
                        </div>
                        <div className="text-xs text-editor-secondary">
                          {participant.userId.includes('user') ? 'Owner' : 'Collaborator'}
                        </div>
                      </div>
                      <div className="w-2 h-2 bg-success-green rounded-full"></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Version Control */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center text-editor-primary">
                  <Save className="w-4 h-4 mr-2 text-warning-yellow" />
                  Version Control
                </h3>
                
                <div className="space-y-2">
                  <Button 
                    onClick={onSaveVersion}
                    className="w-full text-left p-3 bg-editor-bg hover:bg-border-color transition-colors"
                    variant="ghost"
                  >
                    <div className="text-sm font-medium text-editor-primary">Save Current State</div>
                    <div className="text-xs text-editor-secondary mt-1">Create a restore point</div>
                  </Button>
                  
                  {versions.length > 0 && (
                    <div className="text-xs text-editor-secondary">
                      <div className="flex justify-between items-center py-2">
                        <span>Last saved: {new Date(versions[0].createdAt).toLocaleTimeString()}</span>
                        <button className="text-vscode-blue hover:underline">Restore</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="chat" className="flex-1 overflow-hidden p-4">
          <div className="text-center text-editor-secondary">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Chat functionality coming soon</p>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="flex-1 overflow-hidden p-4">
          <div className="text-center text-editor-secondary">
            <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Settings panel coming soon</p>
          </div>
        </TabsContent>
      </Tabs>
    </aside>
  );
}
