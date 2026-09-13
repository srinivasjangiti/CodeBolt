import { useState, useCallback, useEffect } from 'react'
import {
  Plus, MessageSquare, Trash2, Pencil, Check, X, ChevronRight,
  Search, Folder, FolderPlus, MoreVertical, Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { Chat } from '@/types'
import { useFolders } from '@/hooks/useFolders'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'

interface ChatSidebarProps {
  chats: Chat[]
  activeChatId: string | null
  onSelect: (chat: Chat) => void
  onCreate: () => void
  onDelete: (id: string) => void
  onRename: (id: string, title: string) => void
  collapsed: boolean
  onToggleCollapse: () => void
}

export function ChatSidebar({
  chats,
  activeChatId,
  onSelect,
  onCreate,
  onDelete,
  onRename,
  collapsed,
  onToggleCollapse,
}: ChatSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  // Folder & Search State
  const { folders, chatAssignments, createFolder, assignChat, deleteFolder } = useFolders()
  const { userId } = useAuth()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<string[]>([])
  
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        if (!isSupabaseConfigured) {
          const matchedIds: string[] = []
          for (const chat of chats) {
            const raw = localStorage.getItem('codebolt_msgs_' + chat.id)
            if (raw && raw.toLowerCase().includes(searchQuery.toLowerCase())) {
              matchedIds.push(chat.id)
            }
          }
          setSearchResults(matchedIds)
          return
        }

        const { data } = await supabase
          .from('messages')
          .select('chat_id')
          .ilike('content', `%${searchQuery}%`)
          .limit(100)
          
        const matches = Array.from(new Set(data?.map(d => d.chat_id) || []))
        setSearchResults(matches as string[])
      } catch (e) {
        console.error(e)
      } finally {
        setIsSearching(false)
      }
    }, 500)
    
    return () => clearTimeout(timer)
  }, [searchQuery, userId])

  const startEdit = useCallback((chat: Chat) => {
    setEditingId(chat.id)
    setEditValue(chat.title)
  }, [])

  const commitEdit = useCallback(() => {
    if (editingId && editValue.trim()) {
      onRename(editingId, editValue.trim())
    }
    setEditingId(null)
  }, [editingId, editValue, onRename])

  const cancelEdit = useCallback(() => {
    setEditingId(null)
    setEditValue('')
  }, [])

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createFolder(newFolderName)
      setNewFolderName('')
      setIsCreatingFolder(false)
    }
  }

  const filteredChats = chats.filter(chat => {
    if (!searchQuery.trim()) return true;
    const matchesTitle = chat.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMessage = searchResults.includes(chat.id);
    return matchesTitle || matchesMessage;
  });

  const groupedByFolder: Record<string, Chat[]> = { 'Uncategorized': [] }
  folders.forEach(f => groupedByFolder[f] = [])
  
  filteredChats.forEach(chat => {
    const f = chatAssignments[chat.id]
    if (f && folders.includes(f)) {
      groupedByFolder[f].push(chat)
    } else {
      groupedByFolder['Uncategorized'].push(chat)
    }
  })

  // Folders to render (omit empty folders if searching)
  const foldersToRender = ['Uncategorized', ...folders].filter(
    f => groupedByFolder[f].length > 0 || (!searchQuery && f !== 'Uncategorized')
  )

  if (collapsed) {
    return (
      <div className="flex h-full w-12 flex-col items-center border-r border-border bg-sidebar py-3 gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onToggleCollapse}
              className="text-sidebar-foreground/60 hover:text-sidebar-foreground"
            >
              <ChevronRight className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Expand sidebar</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onCreate}
              className="text-sidebar-foreground/60 hover:text-sidebar-foreground"
            >
              <Plus className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">New chat</TooltipContent>
        </Tooltip>

        <Separator className="w-6 bg-sidebar-border" />

        <ScrollArea className="flex-1 w-full">
          <div className="flex flex-col items-center gap-1 px-1">
            {chats.slice(0, 20).map((chat) => (
              <Tooltip key={chat.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onSelect(chat)}
                    className={cn(
                      'flex size-8 items-center justify-center rounded-md transition-colors',
                      activeChatId === chat.id
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground/50 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                    )}
                  >
                    <MessageSquare className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">{chat.title}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        </ScrollArea>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full flex-col bg-transparent">
      {/* Search and Actions */}
      <div className="px-3 pb-2 pt-1 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1.5 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-7 h-7 bg-background/50 border border-border/50 focus-visible:ring-1 focus-visible:ring-primary/50 text-xs rounded-sm"
          />
          {isSearching && (
            <Loader2 className="absolute right-2 top-1.5 size-3.5 animate-spin text-muted-foreground" />
          )}
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={onCreate}
              className="size-7 shrink-0 text-sidebar-foreground/60 hover:text-sidebar-foreground rounded-sm"
            >
              <Plus className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>New chat (Ctrl+N)</TooltipContent>
        </Tooltip>
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Create Folder UI */}
      {isCreatingFolder && (
        <div className="px-3 py-2 flex items-center gap-1 bg-sidebar-accent/30">
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name..."
            className="h-7 text-xs bg-sidebar"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateFolder()
              if (e.key === 'Escape') setIsCreatingFolder(false)
            }}
          />
          <Button variant="ghost" size="icon-xs" onClick={handleCreateFolder} className="size-6 shrink-0">
            <Check className="size-3" />
          </Button>
          <Button variant="ghost" size="icon-xs" onClick={() => setIsCreatingFolder(false)} className="size-6 shrink-0">
            <X className="size-3" />
          </Button>
        </div>
      )}

      {/* Chat List */}
      <ScrollArea className="flex-1 px-2 py-2">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <MessageSquare className="size-8 text-sidebar-foreground/30" />
            <p className="text-xs text-sidebar-foreground/50">No chats yet</p>
            <Button size="xs" variant="outline" onClick={onCreate} className="mt-1">
              <Plus className="size-3" />
              New Chat
            </Button>
          </div>
        ) : filteredChats.length === 0 && searchQuery ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <p className="text-xs text-sidebar-foreground/50">No results found.</p>
          </div>
        ) : (
          foldersToRender.map((folderName) => (
            <div key={folderName} className="mb-4">
              <div className="flex items-center justify-between px-2 mb-1 group">
                <div className="flex items-center gap-1.5 text-sidebar-foreground/60">
                  {folderName === 'Uncategorized' ? (
                    <MessageSquare className="size-3" />
                  ) : (
                    <Folder className="size-3" />
                  )}
                  <p className="text-[10px] font-medium uppercase tracking-wider">
                    {folderName}
                  </p>
                </div>
                {folderName !== 'Uncategorized' && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => deleteFolder(folderName)}
                    className="size-5 opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                    title="Delete folder (keeps chats)"
                  >
                    <X className="size-3" />
                  </Button>
                )}
              </div>
              
              {groupedByFolder[folderName].map((chat) => (
                <div
                  key={chat.id}
                  className="relative group/chat"
                  onMouseEnter={() => setHoveredId(chat.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {editingId === chat.id ? (
                    <div className="flex items-center gap-1 rounded-md bg-sidebar-accent px-2 py-1">
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitEdit()
                          if (e.key === 'Escape') cancelEdit()
                        }}
                        className="h-6 flex-1 border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0"
                        autoFocus
                      />
                      <Button variant="ghost" size="icon-xs" onClick={commitEdit} className="size-5 text-sidebar-foreground/60">
                        <Check className="size-3" />
                      </Button>
                      <Button variant="ghost" size="icon-xs" onClick={cancelEdit} className="size-5 text-sidebar-foreground/60">
                        <X className="size-3" />
                      </Button>
                    </div>
                  ) : (
                    <div
                      className={cn(
                        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors cursor-pointer',
                        activeChatId === chat.id
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
                      )}
                      onClick={() => onSelect(chat)}
                    >
                      <span className="flex-1 truncate text-xs">{chat.title}</span>
                      
                      {hoveredId === chat.id && (
                        <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => startEdit(chat)} className="rounded p-0.5 text-sidebar-foreground/40 hover:text-sidebar-foreground">
                            <Pencil className="size-3" />
                          </button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="rounded p-0.5 text-sidebar-foreground/40 hover:text-sidebar-foreground">
                                <MoreVertical className="size-3" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuSub>
                                <DropdownMenuSubTrigger className="text-xs">
                                  <FolderPlus className="mr-2 size-3" /> Move to Folder
                                </DropdownMenuSubTrigger>
                                <DropdownMenuPortal>
                                  <DropdownMenuSubContent className="w-36">
                                    <DropdownMenuItem className="text-xs" onClick={() => assignChat(chat.id, null)}>
                                      Uncategorized
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    {folders.map(f => (
                                      <DropdownMenuItem key={f} className="text-xs" onClick={() => assignChat(chat.id, f)}>
                                        {f}
                                      </DropdownMenuItem>
                                    ))}
                                    {folders.length === 0 && (
                                      <div className="px-2 py-1 text-[10px] text-muted-foreground">No folders yet</div>
                                    )}
                                  </DropdownMenuSubContent>
                                </DropdownMenuPortal>
                              </DropdownMenuSub>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-xs text-destructive focus:text-destructive" onClick={() => onDelete(chat.id)}>
                                <Trash2 className="mr-2 size-3" /> Delete Chat
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-sidebar-border px-3 py-2 flex items-center justify-between">
        <p className="text-[10px] text-sidebar-foreground/30">
          {chats.length} chat{chats.length !== 1 ? 's' : ''}
        </p>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-xs" onClick={() => setIsCreatingFolder(true)} className="size-5 text-sidebar-foreground/50 hover:text-sidebar-foreground">
              <FolderPlus className="size-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Create Folder</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
