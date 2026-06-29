import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BookOpen, CheckCircle2, Flame, Dumbbell, Search, Plus, Settings2, CalendarDays, Inbox, LayoutDashboard,
  Clock3, FolderKanban, Flag, Tag, Link2, Image, Table2, Code2, Hash, ChevronRight,
  Circle, MoreHorizontal, Bell, GripVertical, BarChart3, Trophy, TimerReset, Play, Pause,
  Moon, Sun, Monitor, Palette, ListTodo, FileText, Zap, Repeat, Activity, LineChart, X, Command,
  PenLine, CalendarRange, Target, Library, Smile, Battery, Bed, ExternalLink
} from 'lucide-react';
import { addDays, format, isToday, parseISO } from 'date-fns';
import './styles.css';

type Module = 'dashboard' | 'notes' | 'tasks' | 'habits' | 'workouts' | 'journal' | 'calendar' | 'goals' | 'resources';
type ThemeMode = 'system' | 'light' | 'dark';
type Priority = 'low' | 'medium' | 'high';
type TaskStatus = 'todo' | 'doing' | 'waiting' | 'done';
type RecurrenceType = 'none' | 'daily' | 'weekdays' | 'weekly' | 'monthly' | 'custom';
type HabitType = 'binary' | 'count' | 'duration';

type Note = { id: string; title: string; body: string; tags: string[]; updated: string; folder?: string };
type Task = { id: string; title: string; project: string; due?: string; priority: Priority; tags: string[]; done: boolean; notes: string; subtasks: { id: string; title: string; done: boolean }[]; attachments: string[]; status?: TaskStatus; recurrence?: { type: RecurrenceType; intervalDays?: number }; reminder?: string; completedAt?: string };
type Habit = { id: string; name: string; icon: string; cadence: string; current: number; longest: number; completions: string[]; color: string; type?: HabitType; goalAmount?: number; reminder?: string; frequency?: string; weekdays?: number[]; weeklyTarget?: number };
type Exercise = { id: string; name: string; group: string; instructions: string; previous: string; rest: number; history: number[] };
type Routine = { id: string; name: string; exercises: string[] };
type WorkoutSet = { exerciseId: string; set: number; weight: number; reps: number; done: boolean };
type WorkoutSession = { id: string; routineName: string; routineId?: string; date: string; duration: number; notes: string; sets: WorkoutSet[] };
type JournalEntry = { id: string; date: string; mood: number; energy: number; sleep: number; wins: string; challenges: string; gratitude: string; notes: string };
type GoalStatus = 'not-started' | 'active' | 'paused' | 'completed';
type GoalMilestone = { id: string; title: string; done: boolean };
type Goal = { id: string; title: string; description: string; status: GoalStatus; targetDate?: string; linkedNotes: string[]; linkedTasks: string[]; linkedHabits: string[]; linkedRoutines: string[]; linkedProjects: string[]; progress: number; milestones: GoalMilestone[] };
type ResourceItem = { id: string; title: string; url: string; description: string; tags: string[]; linkedProject?: string; linkedGoal?: string; linkedNote?: string; createdAt: string };
type AppMetadata = { schemaVersion: 1; updatedAt: string };
type AppData = { metadata: AppMetadata; notes: Note[]; tasks: Task[]; projects: string[]; habits: Habit[]; exerciseList: Exercise[]; routineList: Routine[]; workoutSessions: WorkoutSession[]; journalEntries: JournalEntry[]; goals: Goal[]; resources: ResourceItem[]; calendarMeta?: { defaultView?: 'month' | 'agenda' }; theme: ThemeMode; accent: string };

const APP_VERSION = '1.0.0';
const STORAGE_LOCATION = '/data/multiprodtool-data.json';
const today = new Date();
const uid = () => globalThis.crypto?.randomUUID?.() || `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const initialNotes: Note[] = [
  { id: 'n1', title: 'Product Strategy', folder: 'Work', updated: 'Today', tags: ['#work/project/design', '#planning'], body: '# Product Strategy\n\nA polished workspace inspired by [[Design Principles]] and focused on quiet execution.\n\n- [x] Align modules\n- [ ] Review onboarding\n\n| Area | Goal |\n| --- | --- |\n| Notes | Capture decisions |\n| Tasks | Drive outcomes |\n\n```ts\ntype Focus = "deep" | "admin"\n```' },
  { id: 'n2', title: 'Design Principles', folder: 'Work', updated: 'Yesterday', tags: ['#design/system'], body: '# Design Principles\n\nWhitespace, hierarchy, restrained motion and warm surfaces. Backlinked from [[Product Strategy]].\n\n![Mood](local-image)' },
  { id: 'n3', title: 'Training Ideas', folder: 'Personal', updated: 'Jun 24', tags: ['#health/training'], body: '# Training Ideas\n\nConnect routine notes to workout planning. Mention [[Product Strategy]] when thinking about consistency.' }
];
const initialTasks: Task[] = [
  { id: 't1', title: 'Submit board report', project: 'Operations', due: format(addDays(today, 1), 'yyyy-MM-dd'), priority: 'high', tags: ['report'], done: false, notes: 'Attach final metrics and narrative summary.', attachments: ['Metrics workbook'], subtasks: [{ id: 's1', title: 'Review revenue chart', done: true }, { id: 's2', title: 'Add customer quote', done: false }] },
  { id: 't2', title: 'Prepare design critique', project: 'Design', due: format(today, 'yyyy-MM-dd'), priority: 'medium', tags: ['design'], done: false, notes: 'Collect three screenshots.', attachments: [], subtasks: [] },
  { id: 't3', title: 'Renew gym membership', project: 'Personal', due: format(addDays(today, 5), 'yyyy-MM-dd'), priority: 'low', tags: ['health'], done: false, notes: '', attachments: [], subtasks: [] }
];
const initialProjects = ['Inbox', 'Operations', 'Design', 'Personal'];
const initialHabits: Habit[] = [
  { id: 'h1', name: 'Read', icon: '📚', cadence: 'Daily', current: 18, longest: 42, color: '#8b5cf6', completions: Array.from({ length: 42 }, (_, i) => format(addDays(today, -i * 2), 'yyyy-MM-dd')) },
  { id: 'h2', name: 'Hydrate', icon: '💧', cadence: 'Daily', current: 31, longest: 56, color: '#0ea5e9', completions: Array.from({ length: 74 }, (_, i) => format(addDays(today, -i), 'yyyy-MM-dd')) },
  { id: 'h3', name: 'Meditate', icon: '🧘', cadence: 'Weekdays', current: 8, longest: 20, color: '#10b981', completions: Array.from({ length: 30 }, (_, i) => format(addDays(today, -i * 3), 'yyyy-MM-dd')) },
  { id: 'h4', name: 'Run', icon: '🏃', cadence: 'Mon Wed Fri', current: 4, longest: 12, color: '#f97316', completions: Array.from({ length: 18 }, (_, i) => format(addDays(today, -i * 4), 'yyyy-MM-dd')) }
];
const exercises: Exercise[] = [
  { id: 'e1', name: 'Barbell Squat', group: 'Legs', instructions: 'Brace, descend with control, drive through mid-foot.', previous: '5 × 100 kg', rest: 120, history: [88, 92, 95, 98, 100] },
  { id: 'e2', name: 'Bench Press', group: 'Chest', instructions: 'Retract shoulders, touch lower chest, press smoothly.', previous: '5 × 82.5 kg', rest: 150, history: [70, 75, 77.5, 80, 82.5] },
  { id: 'e3', name: 'Romanian Deadlift', group: 'Posterior', instructions: 'Soft knees, hinge until hamstrings load.', previous: '8 × 90 kg', rest: 120, history: [70, 78, 82, 86, 90] },
  { id: 'e4', name: 'Pull-Up', group: 'Back', instructions: 'Full hang to chin above bar.', previous: '8 bodyweight', rest: 90, history: [5, 6, 7, 7, 8] },
  { id: 'e5', name: 'Overhead Press', group: 'Shoulders', instructions: 'Tight glutes, vertical bar path.', previous: '5 × 52.5 kg', rest: 120, history: [45, 47.5, 50, 50, 52.5] },
  { id: 'e6', name: 'Cable Row', group: 'Back', instructions: 'Neutral spine, squeeze shoulder blades.', previous: '10 × 68 kg', rest: 75, history: [55, 60, 64, 66, 68] }
];
const routines: Routine[] = [
  { id: 'r1', name: 'Push Session', exercises: ['e2', 'e5'] },
  { id: 'r2', name: 'Leg Day', exercises: ['e1', 'e3'] },
  { id: 'r3', name: 'Pull Strength', exercises: ['e4', 'e6'] }
];

function App() {
  const [module, setModule] = useState<Module>('dashboard');
  const [theme, setTheme] = useState<ThemeMode>('system');
  const [accent, setAccent] = useState('#7c5cff');
  const [notes, setNotes] = useState(initialNotes);
  const [tasks, setTasks] = useState(initialTasks);
  const [projects, setProjects] = useState(initialProjects);
  const [habits, setHabits] = useState(initialHabits);
  const [exerciseList, setExerciseList] = useState<Exercise[]>(exercises);
  const [routineList, setRoutineList] = useState<Routine[]>(routines);
  const [workoutSessions, setWorkoutSessions] = useState<WorkoutSession[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [libraryPath, setLibraryPath] = useState<string | null>(null);
  const [libraryReady, setLibraryReady] = useState(!window.multiProd);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'failed' | 'offline'>('idle');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const buildAppData = (): AppData => ({ metadata: { schemaVersion: 1, updatedAt: new Date().toISOString() }, notes, tasks, projects, habits, exerciseList, routineList, workoutSessions, journalEntries, goals, resources, theme, accent });

  const applyLoadedData = (loaded: Partial<AppData> | null | undefined) => {
    if (loaded?.notes) setNotes(loaded.notes);
    if (loaded?.tasks) setTasks(loaded.tasks);
    if (loaded?.projects) setProjects(loaded.projects);
    else if (loaded?.tasks) setProjects(Array.from(new Set(['Inbox', ...loaded.tasks.map(t => t.project).filter(Boolean)])));
    if (loaded?.habits) setHabits(loaded.habits);
    if (loaded?.exerciseList) setExerciseList(loaded.exerciseList);
    if (loaded?.routineList) setRoutineList(loaded.routineList);
    if (loaded?.workoutSessions) setWorkoutSessions(loaded.workoutSessions);
    if (loaded?.journalEntries) setJournalEntries(loaded.journalEntries);
    if (loaded?.goals) setGoals(loaded.goals);
    if (loaded?.resources) setResources(loaded.resources);
    if (loaded?.theme) setTheme(loaded.theme);
    if (loaded?.accent) setAccent(loaded.accent);
  };

  const loadFromWebServer = async () => {
    const response = await fetch('/api/data');
    if (!response.ok) return null;
    const loaded = await response.json();
    return loaded?.data as Partial<AppData> | null;
  };

  const saveToWebServer = async (data: AppData) => {
    const response = await fetch('/api/data', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(`Save failed with status ${response.status}`);
  };

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 3800);
  };

  const exportData = () => {
    const data = buildAppData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `multiprodtool-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showNotice('Backup exported.');
  };

  const validateImport = (value: unknown): Partial<AppData> => {
    if (!value || typeof value !== 'object') throw new Error('This file is not a valid MultiProdTool backup.');
    const candidate = value as Partial<AppData>;
    const hasKnownData = Array.isArray(candidate.notes) || Array.isArray(candidate.tasks) || Array.isArray(candidate.habits) || Array.isArray(candidate.exerciseList) || Array.isArray(candidate.routineList) || Array.isArray(candidate.journalEntries) || Array.isArray(candidate.goals) || Array.isArray(candidate.resources);
    if (!hasKnownData) throw new Error('This backup does not contain recognisable MultiProdTool data.');
    return candidate;
  };

  const importData = async (file: File) => {
    try {
      const parsed = validateImport(JSON.parse(await file.text()));
      if (!window.confirm('Import this backup and replace the current MultiProdTool data?')) return;
      applyLoadedData(parsed);
      showNotice('Backup imported. Saving changes…');
    } catch (error) {
      showNotice(error instanceof Error ? error.message : 'Could not import this backup.');
    }
  };

  const parseDue = (text: string) => {
    if (/next week/i.test(text)) return format(addDays(today, 7), 'yyyy-MM-dd');
    if (/tomorrow/i.test(text)) return format(addDays(today, 1), 'yyyy-MM-dd');
    if (/today/i.test(text)) return format(today, 'yyyy-MM-dd');
    return undefined;
  };

  const createNote = (title = 'Untitled Note', body = '') => {
    const note: Note = { id: uid(), title, body, folder: 'Inbox', tags: body.match(/#[\w/-]+/g) || [], updated: 'Now' };
    setNotes(ns => [note, ...ns]);
    setModule('notes');
    showNotice('Note created.');
  };

  const createTask = (title = 'New task', project = 'Inbox') => {
    const tags = title.match(/#\w+/g)?.map(x => x.slice(1)) || [];
    const clean = title.replace(/#\w+/g, '').replace(/\b(today|tomorrow|next week)\b/ig, '').trim() || title;
    const task: Task = { id: uid(), title: clean, project, due: parseDue(title), priority: 'medium', tags, done: false, notes: '', subtasks: [], attachments: [] };
    setTasks(ts => [task, ...ts]);
    if (!projects.includes(project)) setProjects(ps => [...ps, project]);
    setModule('tasks');
    showNotice('Task created.');
  };

  const createHabit = (name = 'New Habit') => {
    const habit: Habit = { id: uid(), name, icon: '⭐', cadence: 'Daily', current: 0, longest: 0, completions: [], color: accent };
    setHabits(hs => [habit, ...hs]);
    setModule('habits');
    showNotice('Habit created.');
  };

  const createRoutine = (name = 'New Routine') => {
    const routine: Routine = { id: uid(), name, exercises: [] };
    setRoutineList(rs => [routine, ...rs]);
    setModule('workouts');
    showNotice('Routine created.');
  };

  const createGoal = (title = 'New Goal') => {
    const goal: Goal = { id: uid(), title, description: '', status: 'active', targetDate: '', linkedNotes: [], linkedTasks: [], linkedHabits: [], linkedRoutines: [], linkedProjects: [], progress: 0, milestones: [] };
    setGoals(gs => [goal, ...gs]);
    setModule('goals');
    showNotice('Goal created.');
  };

  const createResource = (title = 'New Resource') => {
    const resource: ResourceItem = { id: uid(), title, url: '', description: '', tags: [], createdAt: new Date().toISOString() };
    setResources(rs => [resource, ...rs]);
    setModule('resources');
    showNotice('Resource created.');
  };

  const quickCapture = (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    const match = text.match(/^(note|task|habit|workout|resource):\s*(.+)$/i);
    const kind = match?.[1]?.toLowerCase();
    const content = (match?.[2] || text).trim();
    if (kind === 'note') createNote(content.split('\n')[0] || 'Quick note', content);
    else if (kind === 'habit') createHabit(content.replace(/#\w+/g, '').trim() || 'New Habit');
    else if (kind === 'workout') createRoutine(content.replace(/#\w+/g, '').trim() || 'New Routine');
    else if (kind === 'resource') createResource(content.replace(/#\w+/g, '').trim() || 'New Resource');
    else createTask(content);
  };

  const toggleHabitToday = (id: string) => {
    const day = format(today, 'yyyy-MM-dd');
    setHabits(hs => hs.map(h => {
      if (h.id !== id) return h;
      const done = h.completions.includes(day);
      const current = done ? Math.max(0, h.current - 1) : h.current + 1;
      return { ...h, completions: done ? h.completions.filter(d => d !== day) : [day, ...h.completions], current, longest: done ? h.longest : Math.max(h.longest, current) };
    }));
    showNotice('Habit log updated.');
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    let mounted = true;
    async function boot() {
      if (window.multiProd) {
        const path = await window.multiProd.getLibrary();
        if (!mounted) return;
        setLibraryPath(path);
        if (path) {
          const loaded = await window.multiProd.loadData() as Partial<AppData> | null;
          if (!mounted) return;
          applyLoadedData(loaded);
        }
        setLibraryReady(Boolean(path));
        return;
      }

      try {
        const loaded = await loadFromWebServer();
        if (!mounted) return;
        applyLoadedData(loaded);
        setLibraryPath('ZimaOS server storage');
        setLibraryReady(true);
      } catch {
        if (!mounted) return;
        setLibraryPath('Browser demo session');
        setLibraryReady(true);
      }
    }
    boot();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!libraryPath || !libraryReady) return;
    setSaveState('saving');
    const handle = window.setTimeout(async () => {
      try {
        const data = buildAppData();
        if (window.multiProd) await window.multiProd.saveData(data);
        else await saveToWebServer(data);
        setSaveState('saved');
      } catch (error) {
        setSaveState(navigator.onLine ? 'failed' : 'offline');
        showNotice(navigator.onLine ? 'Save failed. Your latest changes may not be stored yet.' : 'Server unreachable. Changes are not saved yet.');
        return;
      }
      window.setTimeout(() => setSaveState('idle'), 1200);
    }, 350);
    return () => window.clearTimeout(handle);
  }, [libraryPath, libraryReady, notes, tasks, projects, habits, exerciseList, routineList, workoutSessions, journalEntries, goals, resources, theme, accent]);

  const chooseLibrary = async () => {
    if (!window.multiProd) return;
    const path = await window.multiProd.chooseLibrary();
    if (path) {
      setLibraryPath(path);
      const loaded = await window.multiProd.loadData() as Partial<AppData> | null;
      applyLoadedData(loaded);
      setLibraryReady(true);
    }
  };

  const themeClass = theme === 'system' ? 'theme-system' : theme === 'dark' ? 'theme-dark' : 'theme-light';
  return <div className={`app ${themeClass}`} style={{ '--accent': accent } as React.CSSProperties}>
    {!libraryReady && <LibraryOnboarding chooseLibrary={chooseLibrary} />}
    <Sidebar active={module} setActive={setModule} collapsed={sidebarCollapsed} libraryPath={libraryPath} saveState={saveState} openSettings={() => setSettingsOpen(true)} toggleCollapsed={() => setSidebarCollapsed(v => !v)} />
    <main className="workspace">
      <WindowBar title={module[0].toUpperCase() + module.slice(1)} openCommand={() => setCommandOpen(true)} toggleSidebar={() => setSidebarCollapsed(v => !v)} sidebarCollapsed={sidebarCollapsed} />
      {module === 'dashboard' && <DashboardModule notes={notes} tasks={tasks} habits={habits} routineList={routineList} workoutSessions={workoutSessions} journalEntries={journalEntries} goals={goals} resources={resources} quickCapture={quickCapture} setModule={setModule} toggleHabit={toggleHabitToday} />}
      {module === 'notes' && <NotesModule notes={notes} setNotes={setNotes} />}
      {module === 'tasks' && <TasksModule tasks={tasks} setTasks={setTasks} projects={projects} setProjects={setProjects} />}
      {module === 'habits' && <HabitsModule habits={habits} setHabits={setHabits} />}
      {module === 'workouts' && <WorkoutsModule exerciseList={exerciseList} setExerciseList={setExerciseList} routineList={routineList} setRoutineList={setRoutineList} workoutSessions={workoutSessions} setWorkoutSessions={setWorkoutSessions} />}
      {module === 'journal' && <JournalModule journalEntries={journalEntries} setJournalEntries={setJournalEntries} habits={habits} tasks={tasks} workoutSessions={workoutSessions} />}
      {module === 'calendar' && <CalendarModule tasks={tasks} habits={habits} workoutSessions={workoutSessions} journalEntries={journalEntries} notes={notes} setModule={setModule} />}
      {module === 'goals' && <GoalsModule goals={goals} setGoals={setGoals} notes={notes} tasks={tasks} habits={habits} routineList={routineList} projects={projects} />}
      {module === 'resources' && <ResourcesModule resources={resources} setResources={setResources} notes={notes} goals={goals} projects={projects} />}
    </main>
    {notice && <div className="toast">{notice}</div>}
    {commandOpen && <CommandPalette notes={notes} tasks={tasks} habits={habits} routineList={routineList} exerciseList={exerciseList} journalEntries={journalEntries} goals={goals} resources={resources} setModule={setModule} close={() => setCommandOpen(false)} createNote={createNote} createTask={createTask} createHabit={createHabit} createRoutine={createRoutine} createGoal={createGoal} createResource={createResource} />}
    {settingsOpen && <SettingsModal version={APP_VERSION} storageLocation={STORAGE_LOCATION} saveState={saveState} theme={theme} setTheme={setTheme} accent={accent} setAccent={setAccent} exportData={exportData} importData={importData} close={() => setSettingsOpen(false)} />}

  </div>;
}

function LibraryOnboarding({ chooseLibrary }: { chooseLibrary: () => void }) {
  return <div className="onboarding-backdrop">
    <div className="onboarding-card">
      <div className="brand-mark large">M</div>
      <p>Choose your library</p>
      <h1>Where should MultiProdTool store your data?</h1>
      <span>Your notes, tasks, habits, workouts, theme and settings will be saved as a readable JSON file in the folder you choose. Pick an iCloud Drive, Dropbox, OneDrive, Google Drive or local folder if you want cross-device file sync.</span>
      <button className="primary-action" onClick={chooseLibrary}>Choose Library Folder</button>
    </div>
  </div>;
}

function WindowBar({ title, openCommand, toggleSidebar, sidebarCollapsed }: { title: string; openCommand: () => void; toggleSidebar: () => void; sidebarCollapsed: boolean }) {
  return <div className="windowbar">
    <button className="sidebar-toggle" onClick={toggleSidebar}>{sidebarCollapsed ? 'Show navigation' : 'Hide navigation'}</button>
    <div className="window-title">MultiProdTool · {title}</div>
    <button className="command-button" onClick={openCommand}><Command size={15}/> Search</button>
  </div>;
}

function Sidebar({ active, setActive, collapsed, libraryPath, saveState, openSettings, toggleCollapsed }: { active: Module; setActive: (m: Module) => void; collapsed: boolean; libraryPath: string | null; saveState: 'idle' | 'saving' | 'saved' | 'failed' | 'offline'; openSettings: () => void; toggleCollapsed: () => void }) {
  const items = [
    { id: 'dashboard' as Module, label: 'Today', icon: LayoutDashboard, group: 'Home' },
    { id: 'notes' as Module, label: 'Notes', icon: BookOpen, group: 'Capture' },
    { id: 'tasks' as Module, label: 'Tasks', icon: CheckCircle2, group: 'Plan' },
    { id: 'habits' as Module, label: 'Habits', icon: Flame, group: 'Momentum' },
    { id: 'workouts' as Module, label: 'Workouts', icon: Dumbbell, group: 'Training' },
    { id: 'journal' as Module, label: 'Journal', icon: PenLine, group: 'Reflect' },
    { id: 'calendar' as Module, label: 'Calendar', icon: CalendarRange, group: 'Plan' },
    { id: 'goals' as Module, label: 'Goals', icon: Target, group: 'Direction' },
    { id: 'resources' as Module, label: 'Resources', icon: Library, group: 'Library' }
  ];
  return <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
    <div className="brand"><div className="brand-mark">M</div><div className="brand-copy"><strong>MultiProdTool</strong><span>Unified workspace</span></div><button className="collapse-nav" onClick={toggleCollapsed}>{collapsed ? '›' : '‹'}</button></div>
    <nav>{items.map((item, i) => <div key={item.id} className="nav-group"> 
      {(i === 0 || items[i - 1].group !== item.group) && <p>{item.group}</p>}
      <button title={item.label} className={active === item.id ? 'active' : ''} onClick={() => setActive(item.id)}><item.icon size={18}/><span>{item.label}</span><ChevronRight size={15}/></button>
    </div>)}</nav>
    <div className="sidebar-card compact">
      <div className="library-status"><strong>{saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved' : saveState === 'failed' ? 'Save failed' : saveState === 'offline' ? 'Offline' : 'Library'}</strong><span>{libraryPath || 'Not selected'}</span><button onClick={openSettings}><Settings2 size={15}/><span>Settings</span></button></div>
    </div>
  </aside>;
}



function DashboardModule({ notes, tasks, habits, routineList, workoutSessions, journalEntries, goals, resources, quickCapture, setModule, toggleHabit }: { notes: Note[]; tasks: Task[]; habits: Habit[]; routineList: Routine[]; workoutSessions: WorkoutSession[]; journalEntries: JournalEntry[]; goals: Goal[]; resources: ResourceItem[]; quickCapture: (text: string) => void; setModule: (m: Module) => void; toggleHabit: (id: string) => void }) {
  const [capture, setCapture] = useState('');
  const todayKey = format(today, 'yyyy-MM-dd');
  const todayTasks = tasks.filter(t => !t.done && t.due === todayKey);
  const overdueTasks = tasks.filter(t => !t.done && t.due && t.due < todayKey);
  const upcomingTasks = tasks.filter(t => !t.done && t.due && t.due > todayKey && t.due <= format(addDays(today, 7), 'yyyy-MM-dd')).slice(0, 6);
  const dueHabits = habits.filter(h => !h.completions.includes(todayKey));
  const topStreaks = [...habits].sort((a,b)=>b.current-a.current).slice(0, 4);
  const suggestedRoutine = routineList[0];
  const recentNotes = notes.slice(0, 5);
  const journalToday = journalEntries.find(j => j.date === todayKey);
  const activeGoals = goals.filter(g => g.status !== 'completed').slice(0, 4);
  const agenda = [...tasks.filter(t => t.due && t.due >= todayKey).map(t=>({date:t.due!, label:t.title, type:'Task'})), ...workoutSessions.map(w=>({date:w.date.slice(0,10), label:w.routineName, type:'Workout'}))].filter(x=>x.date >= todayKey).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,5);
  const submit = () => { if (!capture.trim()) return; quickCapture(capture); setCapture(''); };
  return <section className="module dashboard-layout">
    <div className="dashboard-main">
      <div className="hero dashboard-hero"><div><p>Today command centre</p><h1>{format(today, 'EEEE, d MMMM')}</h1></div><button className="pill-btn" onClick={()=>setModule('tasks')}><CalendarDays size={16}/> Plan day</button></div>
      <div className="quick-capture-card"><div><Zap size={18}/><strong>Quick capture</strong></div><div className="quick-capture-input"><input value={capture} onChange={e=>setCapture(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')submit();}} placeholder="task: Submit report tomorrow #work · note: Meeting idea · resource: Useful link"/><button onClick={submit}>Capture</button></div></div>
      <div className="dashboard-grid">
        <DashboardCard title="Due today" action="Tasks" onAction={()=>setModule('tasks')}>{todayTasks.length ? todayTasks.map(t=><DashboardTask key={t.id} task={t}/>) : <p className="muted-line">No tasks due today.</p>}</DashboardCard>
        <DashboardCard title="Journal prompt" action={journalToday ? 'Open' : 'Write'} onAction={()=>setModule('journal')}><div className="journal-prompt"><PenLine/><strong>{journalToday ? 'Today is captured.' : 'What is one win you want to remember?'}</strong><span>{journalToday ? `Mood ${journalToday.mood}/5 · Energy ${journalToday.energy}/5` : 'Reflect on wins, challenges and gratitude.'}</span></div></DashboardCard>
        <DashboardCard title="Agenda" action="Calendar" onAction={()=>setModule('calendar')}>{agenda.length ? agenda.map(a=><div className="dash-row" key={`${a.type}-${a.date}-${a.label}`}><span>{a.type}: {a.label}</span><strong>{format(parseISO(a.date),'d MMM')}</strong></div>) : <p className="muted-line">No scheduled items.</p>}</DashboardCard>
        <DashboardCard title="Goal progress" action="Goals" onAction={()=>setModule('goals')}>{activeGoals.length ? activeGoals.map(g=><div className="goal-mini" key={g.id}><div><strong>{g.title}</strong><span>{g.status}</span></div><progress value={g.progress} max={100}/><small>{g.progress}%</small></div>) : <p className="muted-line">Create a goal to connect your work.</p>}</DashboardCard>
        <DashboardCard title="Overdue" tone={overdueTasks.length?'danger':undefined} action="Review" onAction={()=>setModule('tasks')}>{overdueTasks.length ? overdueTasks.slice(0,5).map(t=><DashboardTask key={t.id} task={t}/>) : <p className="muted-line">Nothing overdue.</p>}</DashboardCard>
        <DashboardCard title="Upcoming" action="7 days" onAction={()=>setModule('tasks')}>{upcomingTasks.length ? upcomingTasks.map(t=><DashboardTask key={t.id} task={t}/>) : <p className="muted-line">No upcoming deadlines.</p>}</DashboardCard>
        <DashboardCard title="Habits today" action="Habits" onAction={()=>setModule('habits')}>{dueHabits.length ? dueHabits.slice(0,6).map(h=><button className="dash-habit" key={h.id} onClick={()=>toggleHabit(h.id)}><span>{h.icon}</span><strong>{h.name}</strong><small>{h.current} streak</small></button>) : <p className="muted-line">All habits logged.</p>}</DashboardCard>
        <DashboardCard title="Suggested workout" action="Workouts" onAction={()=>setModule('workouts')}>{suggestedRoutine ? <div className="suggested-workout"><Dumbbell/><strong>{suggestedRoutine.name}</strong><span>{suggestedRoutine.exercises.length} exercises ready</span></div> : <p className="muted-line">Create a routine to get started.</p>}</DashboardCard>
      </div>
    </div>
    <aside className="dashboard-side"><DashboardCard title="Recent notes" action="Notes" onAction={()=>setModule('notes')}>{recentNotes.map(n=><button className="recent-note" key={n.id} onClick={()=>setModule('notes')}><FileText size={15}/><span>{n.title || 'Untitled Note'}</span><small>{n.folder || 'Inbox'}</small></button>)}</DashboardCard><DashboardCard title="Recent resources" action="Resources" onAction={()=>setModule('resources')}>{resources.slice(0,5).map(r=><button className="recent-note" key={r.id} onClick={()=>setModule('resources')}><Library size={15}/><span>{r.title}</span><small>{r.tags.join(', ') || 'Resource'}</small></button>)}</DashboardCard></aside>
  </section>;
}

function DashboardCard({ title, children, action, onAction, tone }: { title: string; children: React.ReactNode; action?: string; onAction?: () => void; tone?: 'danger' }) {
  return <article className={`dashboard-card ${tone || ''}`}><div className="dashboard-card-head"><h2>{title}</h2>{action && <button onClick={onAction}>{action}</button>}</div><div className="dashboard-card-body">{children}</div></article>;
}

function DashboardTask({ task }: { task: Task }) {
  return <div className="dash-task"><span className={`priority-dot ${task.priority}`}/><strong>{task.title}</strong><small>{task.due || 'Anytime'}</small></div>;
}

function CommandPalette({ notes, tasks, habits, routineList, exerciseList, journalEntries, goals, resources, setModule, close, createNote, createTask, createHabit, createRoutine, createGoal, createResource }: { notes: Note[]; tasks: Task[]; habits: Habit[]; routineList: Routine[]; exerciseList: Exercise[]; journalEntries: JournalEntry[]; goals: Goal[]; resources: ResourceItem[]; setModule: (m: Module) => void; close: () => void; createNote: (title?: string, body?: string) => void; createTask: (title?: string, project?: string) => void; createHabit: (name?: string) => void; createRoutine: (name?: string) => void; createGoal: (title?: string) => void; createResource: (title?: string) => void }) {
  const [query, setQuery] = useState('');
  const q = query.toLowerCase().trim();
  const run = (action: () => void) => { action(); close(); };
  const noteResults = q ? notes.filter(n => `${n.title} ${n.body} ${n.tags.join(' ')}`.toLowerCase().includes(q)).slice(0, 5) : [];
  const taskResults = q ? tasks.filter(t => `${t.title} ${t.project} ${t.tags.join(' ')}`.toLowerCase().includes(q)).slice(0, 5) : [];
  const habitResults = q ? habits.filter(h => h.name.toLowerCase().includes(q)).slice(0, 5) : [];
  const workoutResults = q ? [...routineList.map(r=>({type:'routine' as const, id:r.id, name:r.name})), ...exerciseList.map(e=>({type:'exercise' as const, id:e.id, name:e.name}))].filter(x => x.name.toLowerCase().includes(q)).slice(0, 5) : [];
  const journalResults = q ? journalEntries.filter(j => `${j.date} ${j.wins} ${j.challenges} ${j.gratitude} ${j.notes}`.toLowerCase().includes(q)).slice(0, 5) : [];
  const goalResults = q ? goals.filter(g => `${g.title} ${g.description} ${g.status}`.toLowerCase().includes(q)).slice(0, 5) : [];
  const resourceResults = q ? resources.filter(r => `${r.title} ${r.url} ${r.description} ${r.tags.join(' ')}`.toLowerCase().includes(q)).slice(0, 5) : [];
  return <div className="command-backdrop" role="dialog" aria-modal="true" aria-label="Command palette" onMouseDown={close}>
    <div className="command-modal" onMouseDown={e=>e.stopPropagation()}>
      <div className="command-search"><Search size={18}/><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search or create anything…"/><button onClick={close}><X size={16}/></button></div>
      {!q && <div className="command-section"><h3>Actions</h3><button onClick={()=>run(()=>setModule('dashboard'))}><LayoutDashboard/> Go to Today</button><button onClick={()=>run(()=>setModule('journal'))}><PenLine/> Open Journal</button><button onClick={()=>run(()=>setModule('calendar'))}><CalendarRange/> Open Calendar</button><button onClick={()=>run(()=>createNote('Untitled Note',''))}><FileText/> New note</button><button onClick={()=>run(()=>createTask('New task'))}><CheckCircle2/> New task</button><button onClick={()=>run(()=>createHabit('New Habit'))}><Flame/> New habit</button><button onClick={()=>run(()=>createRoutine('New Routine'))}><Dumbbell/> New routine</button><button onClick={()=>run(()=>createGoal('New Goal'))}><Target/> New goal</button><button onClick={()=>run(()=>createResource('New Resource'))}><Library/> New resource</button></div>}
      {q && <div className="command-results">
        <CommandGroup title="Notes">{noteResults.map(n=><button key={n.id} onClick={()=>run(()=>setModule('notes'))}><FileText/><span>{n.title || 'Untitled Note'}</span><small>{n.folder || 'Inbox'}</small></button>)}</CommandGroup>
        <CommandGroup title="Tasks">{taskResults.map(t=><button key={t.id} onClick={()=>run(()=>setModule('tasks'))}><CheckCircle2/><span>{t.title}</span><small>{t.project}</small></button>)}</CommandGroup>
        <CommandGroup title="Habits">{habitResults.map(h=><button key={h.id} onClick={()=>run(()=>setModule('habits'))}><Flame/><span>{h.name}</span><small>{h.current} streak</small></button>)}</CommandGroup>
        <CommandGroup title="Workouts">{workoutResults.map(w=><button key={`${w.type}-${w.id}`} onClick={()=>run(()=>setModule('workouts'))}><Dumbbell/><span>{w.name}</span><small>{w.type}</small></button>)}</CommandGroup>
        <CommandGroup title="Journal">{journalResults.map(j=><button key={j.id} onClick={()=>run(()=>setModule('journal'))}><PenLine/><span>{format(parseISO(j.date),'d MMM yyyy')}</span><small>Mood {j.mood}/5</small></button>)}</CommandGroup>
        <CommandGroup title="Goals">{goalResults.map(g=><button key={g.id} onClick={()=>run(()=>setModule('goals'))}><Target/><span>{g.title}</span><small>{g.progress}%</small></button>)}</CommandGroup>
        <CommandGroup title="Resources">{resourceResults.map(r=><button key={r.id} onClick={()=>run(()=>setModule('resources'))}><Library/><span>{r.title}</span><small>{r.url || r.tags.join(', ')}</small></button>)}</CommandGroup>
        {!noteResults.length && !taskResults.length && !habitResults.length && !workoutResults.length && !journalResults.length && !goalResults.length && !resourceResults.length && <div className="command-empty"><p>No results found.</p><button onClick={()=>run(()=>createTask(query))}>Create task “{query}”</button></div>}
      </div>}
    </div>
  </div>;
}

function CommandGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="command-section"><h3>{title}</h3>{children}</div>;
}

function SettingsModal({ version, storageLocation, saveState, theme, setTheme, accent, setAccent, exportData, importData, close }: { version: string; storageLocation: string; saveState: 'idle' | 'saving' | 'saved' | 'failed' | 'offline'; theme: ThemeMode; setTheme: (theme: ThemeMode) => void; accent: string; setAccent: (accent: string) => void; exportData: () => void; importData: (file: File) => void; close: () => void }) {
  const fileInputId = 'multiprod-import-file';
  const saveLabel = saveState === 'saving' ? 'Saving changes…' : saveState === 'saved' ? 'Saved' : saveState === 'failed' ? 'Save failed' : saveState === 'offline' ? 'Server unreachable' : 'Ready';
  return <div className="settings-backdrop" role="dialog" aria-modal="true" aria-label="Settings">
    <div className="settings-modal">
      <div className="settings-head"><div><p>Settings</p><h1>MultiProdTool</h1><span>Version {version}</span></div><button className="icon-btn" onClick={close}><X size={18}/></button></div>
      <div className={`save-banner ${saveState === 'failed' || saveState === 'offline' ? 'danger' : ''}`}><strong>{saveLabel}</strong><span>{saveState === 'failed' || saveState === 'offline' ? 'Your latest changes may not be stored yet. Keep this tab open and retry when the server is reachable.' : 'Changes are saved automatically to your server volume.'}</span></div>
      <div className="settings-grid">
        <section className="settings-section"><h2>Storage</h2><p>Current data file</p><code>{storageLocation}</code><small>Docker volume data persists across container updates as long as the /data volume is kept.</small></section>
        <section className="settings-section"><h2>Appearance</h2><div className="segmented settings-segmented"><button className={theme==='system'?'on':''} onClick={() => setTheme('system')}><Monitor size={14}/> System</button><button className={theme==='light'?'on':''} onClick={() => setTheme('light')}><Sun size={14}/> Light</button><button className={theme==='dark'?'on':''} onClick={() => setTheme('dark')}><Moon size={14}/> Dark</button></div><label className="settings-color"><Palette size={16}/> Accent colour <input type="color" value={accent} onChange={e=>setAccent(e.target.value)} /></label></section>
        <section className="settings-section"><h2>Backup</h2><p>Export or import a complete MultiProdTool JSON backup.</p><div className="settings-actions"><button className="primary-action" onClick={exportData}>Export backup</button><label className="import-button" htmlFor={fileInputId}>Import backup</label><input id={fileInputId} type="file" accept="application/json,.json" onChange={e=>{ const file=e.currentTarget.files?.[0]; if(file) importData(file); e.currentTarget.value=''; }} /></div><small>The server also creates automatic backups before overwriting the data file and keeps the latest 30 backups.</small></section>
        <section className="settings-section"><h2>Security</h2><p>MultiProdTool is intended for private self-hosting. Use Tailscale, Cloudflare Access, or Basic Auth before exposing it outside your trusted network.</p><small>Optional environment variables: MULTIPROD_AUTH_USERNAME and MULTIPROD_AUTH_PASSWORD.</small></section>
        <section className="settings-section wide"><h2>AI disclosure</h2><p>This project was fully built using AI-assisted development through Arena.ai Agent Mode, guided by human prompts, testing, and review. Review and secure the app before sensitive or public use.</p></section>
      </div>
    </div>
  </div>;
}

function mdInline(text: string, notes: Note[], open: (title: string) => void) {
  const parts = text.split(/(\[\[[^\]]+\]\]|#[\w/-]+)/g);
  return parts.map((p, i) => {
    if (p.startsWith('[[')) { const title = p.slice(2, -2); return <button key={i} className="wikilink" onClick={() => open(title)}><Link2 size={13}/>{title}</button>; }
    if (p.startsWith('#')) return <span className="tagpill" key={i}>{p}</span>;
    return p;
  });
}
function Markdown({ body, notes, open }: { body: string; notes: Note[]; open: (title: string) => void }) {
  const lines = body.split('\n');
  let inCode = false;
  return <div className="markdown">{lines.map((line, i) => {
    if (line.startsWith('```')) { inCode = !inCode; return <div key={i} className="code-edge"><Code2 size={14}/></div>; }
    if (inCode) return <pre key={i}>{line}</pre>;
    if (line.startsWith('# ')) return <h1 key={i}>{mdInline(line.slice(2), notes, open)}</h1>;
    if (line.startsWith('## ')) return <h2 key={i}>{mdInline(line.slice(3), notes, open)}</h2>;
    if (/^- \[[ x]\]/.test(line)) return <label key={i} className="md-check"><input type="checkbox" checked={line.includes('[x]')} readOnly />{mdInline(line.replace(/^- \[[ x]\]\s*/, ''), notes, open)}</label>;
    if (line.startsWith('|')) return <div key={i} className="md-table"><Table2 size={14}/>{line.split('|').filter(Boolean).map((c, j)=><span key={j}>{c.trim()}</span>)}</div>;
    if (line.startsWith('![')) return <div key={i} className="media-card"><Image size={20}/> Embedded image preview</div>;
    if (line.startsWith('- ')) return <p key={i} className="bullet">• {mdInline(line.slice(2), notes, open)}</p>;
    return <p key={i}>{mdInline(line, notes, open)}</p>;
  })}</div>;
}
function NotesModule({ notes, setNotes }: { notes: Note[]; setNotes: React.Dispatch<React.SetStateAction<Note[]>> }) {
  const [selected, setSelected] = useState(notes[0]?.id || '');
  const [query, setQuery] = useState('');
  const [preview, setPreview] = useState(true);
  const [folderFilter, setFolderFilter] = useState('All');
  const folders = Array.from(new Set(notes.map(n => n.folder || 'Inbox'))).sort();
  const current = notes.find(n => n.id === selected) || notes[0];
  useEffect(() => { if (!notes.some(n => n.id === selected)) setSelected(notes[0]?.id || ''); }, [notes, selected]);
  const filtered = notes.filter(n => (folderFilter === 'All' || (n.folder || 'Inbox') === folderFilter) && (n.title + n.body + n.tags.join(' ') + (n.folder || '')).toLowerCase().includes(query.toLowerCase()));
  const backlinks = current ? notes.filter(n => n.id !== current.id && n.body.includes(`[[${current.title}]]`)) : [];
  const openTitle = (title: string) => { const found = notes.find(n => n.title.toLowerCase() === title.toLowerCase()); if (found) setSelected(found.id); };
  const updateBody = (body: string) => current && setNotes(ns => ns.map(n => n.id === current.id ? { ...n, body, updated: 'Now' } : n));
  const addNote = () => { const id = uid(); const folder = folderFilter === 'All' ? 'Inbox' : folderFilter; setNotes(ns => [{ id, title: '', body: '', folder, tags: ['#inbox'], updated: 'Now' }, ...ns]); setSelected(id); setPreview(false); };
  const addFolder = () => { const name = window.prompt('New folder name'); if (name?.trim()) setFolderFilter(name.trim()); };
  const updateTitle = (title: string) => current && setNotes(ns => ns.map(n => n.id === current.id ? { ...n, title, updated: 'Now' } : n));
  const updateFolder = (folder: string) => current && setNotes(ns => ns.map(n => n.id === current.id ? { ...n, folder: folder || 'Inbox', updated: 'Now' } : n));
  if (!current) return <section className="module"><button className="pill-btn" onClick={addNote}><Plus size={16}/> New note</button></section>;
  const displayTitle = current.title.trim() || 'Untitled Note';
  return <section className="module notes-layout">
    <div className="pane note-list">
      <div className="pane-head"><h2>Notes</h2><button className="icon-btn add-note-btn" title="Create note" onClick={addNote}><Plus size={19}/></button></div>
      <div className="folder-row"><button className={folderFilter==='All'?'selected':''} onClick={()=>setFolderFilter('All')}>All</button>{folders.map(f=><button key={f} className={folderFilter===f?'selected':''} onClick={()=>setFolderFilter(f)}>{f}</button>)}<button onClick={addFolder}><Plus size={13}/> Folder</button></div>
      <div className="search"><Search size={16}/><input placeholder="Search notes, tags, backlinks" value={query} onChange={e=>setQuery(e.target.value)} /></div>
      <div className="sort-row"><span>Sorted by recent</span><Hash size={14}/></div>
      {filtered.map(n => <button key={n.id} className={`note-row ${n.id===selected?'selected':''}`} onClick={()=>setSelected(n.id)}><FileText size={17}/><div><strong>{n.title || 'Untitled Note'}</strong><p>{(n.body || 'Start writing…').replace(/[#`\[\]]/g,'').slice(0, 74)}…</p><small>{n.folder || 'Inbox'} · {n.tags.join('  ')}</small></div></button>)}
    </div>
    <div className="editor-shell">
      <div className="editor-topline"><div className="title-stack"><input className="title-input" value={current.title} placeholder="Untitled Note" onChange={e=>updateTitle(e.target.value)}/><select className="folder-select" value={current.folder || 'Inbox'} onChange={e=>updateFolder(e.target.value)}>{Array.from(new Set(['Inbox', ...folders, current.folder || 'Inbox'])).map(f=><option key={f}>{f}</option>)}</select></div><button className="pill-btn subtle" onClick={()=>setPreview(!preview)}>{preview ? 'Edit' : 'Save'}</button></div>
      {!preview ? <textarea className="markdown-input" value={current.body} onChange={e=>updateBody(e.target.value)} placeholder="Start writing in Markdown…\n\nTry #tags, [[links]], checklists, tables, code blocks or image embeds." autoFocus /> : <div className="editor-grid rendered-only" onDoubleClick={()=>setPreview(false)}><Markdown body={current.body || `# ${displayTitle}\n\nStart writing…`} notes={notes} open={openTitle} /></div>}
    </div>
    <div className="pane backlinks"><h3>Backlinks</h3>{backlinks.length ? backlinks.map(b => <button key={b.id} onClick={()=>setSelected(b.id)}><Link2 size={15}/><span>{b.title || 'Untitled Note'}</span></button>) : <div className="empty">No backlinks yet</div>}<h3>Nested tags</h3>{current.tags.map(t=><span key={t} className="tagpill">{t}</span>)}</div>
  </section>;
}

function parseTask(input: string): Partial<Task> & { title: string } {
  let title = input.trim(); let due: string | undefined; let priority: Priority = 'medium';
  if (/next tuesday/i.test(title)) { due = format(addDays(today, (9 - today.getDay()) % 7 || 7), 'yyyy-MM-dd'); title = title.replace(/next tuesday/ig, '').trim(); }
  else if (/today/i.test(title)) { due = format(today, 'yyyy-MM-dd'); title = title.replace(/today/ig, '').trim(); }
  else if (/tomorrow/i.test(title)) { due = format(addDays(today, 1), 'yyyy-MM-dd'); title = title.replace(/tomorrow/ig, '').trim(); }
  const at = title.match(/at\s+\d{1,2}(:\d{2})?\s*(am|pm)?/i); if (at) title = title.replace(at[0], '').trim();
  if (/!high/i.test(title)) { priority = 'high'; title = title.replace(/!high/ig, '').trim(); }
  if (/!low/i.test(title)) { priority = 'low'; title = title.replace(/!low/ig, '').trim(); }
  return { title, due, priority };
}
function nextDueDate(due: string | undefined, recurrence?: Task['recurrence']) {
  if (!due || !recurrence || recurrence.type === 'none') return undefined;
  const base = parseISO(due);
  if (recurrence.type === 'daily') return format(addDays(base, 1), 'yyyy-MM-dd');
  if (recurrence.type === 'weekdays') {
    let d = addDays(base, 1);
    while ([0, 6].includes(d.getDay())) d = addDays(d, 1);
    return format(d, 'yyyy-MM-dd');
  }
  if (recurrence.type === 'weekly') return format(addDays(base, 7), 'yyyy-MM-dd');
  if (recurrence.type === 'monthly') { const d = new Date(base); d.setMonth(d.getMonth() + 1); return format(d, 'yyyy-MM-dd'); }
  if (recurrence.type === 'custom') return format(addDays(base, recurrence.intervalDays || 1), 'yyyy-MM-dd');
  return undefined;
}

function TasksModule({ tasks, setTasks, projects, setProjects }: { tasks: Task[]; setTasks: React.Dispatch<React.SetStateAction<Task[]>>; projects: string[]; setProjects: React.Dispatch<React.SetStateAction<string[]>> }) {
  const [view, setView] = useState('Inbox'); const [quick, setQuick] = useState('');
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [kanban, setKanban] = useState(false);
  const normalisedProjects = Array.from(new Set(['Inbox', ...projects, ...tasks.map(t=>t.project)])).filter(Boolean);
  const views = ['Inbox', 'Today', 'Upcoming', ...normalisedProjects.filter(p=>p !== 'Inbox').map(p=>`Project · ${p}`)];
  const currentProject = view.startsWith('Project') ? view.replace('Project · ','') : 'Inbox';
  const visible = tasks.filter(t => dateFilter ? t.due === dateFilter : view==='Inbox' ? !t.done : view==='Today' ? t.due && isToday(parseISO(t.due)) : view==='Upcoming' ? t.due : view.startsWith('Project') ? t.project === currentProject : true);
  const add = () => { if (!quick.trim()) return; const parsed = parseTask(quick); const task: Task = { id: uid(), title: parsed.title, project: view.startsWith('Project') ? currentProject : 'Inbox', due: parsed.due, priority: parsed.priority || 'medium', tags: quick.match(/#\w+/g)?.map(x=>x.slice(1)) || [], done: false, status: 'todo', recurrence: { type: 'none' }, notes: '', attachments: [], subtasks: [] }; setTasks([task, ...tasks]); setQuick(''); };
  const toggle = (id: string) => setTasks(ts => {
    const target = ts.find(t => t.id === id);
    if (!target) return ts;
    const willBeDone = !target.done;
    let next = ts.map(t => t.id===id?{...t,done:willBeDone,status:willBeDone?'done':(t.status === 'done' ? 'todo' : t.status || 'todo') as TaskStatus, completedAt: willBeDone ? new Date().toISOString() : undefined}:t);
    if (willBeDone && target.recurrence && target.recurrence.type !== 'none') {
      const due = nextDueDate(target.due, target.recurrence);
      if (due) next = [{ ...target, id: uid(), due, done: false, status: 'todo', subtasks: target.subtasks.map(s=>({...s, id: uid(), done:false})) }, ...next];
    }
    return next;
  });
  const updateTask = (id: string, patch: Partial<Task>) => setTasks(ts => ts.map(t => t.id === id ? { ...t, ...patch } : t));
  const selectView = (v: string) => { setDateFilter(null); setView(v); };
  const selectDay = (d: Date) => { setDateFilter(format(d, 'yyyy-MM-dd')); setView('Upcoming'); };
  const addProject = () => { const name = window.prompt('Project name'); if (!name?.trim()) return; const clean = name.trim(); setProjects(ps => Array.from(new Set([...ps, clean]))); setView(`Project · ${clean}`); setDateFilter(null); };
  const renameProject = (oldName: string) => { const name = window.prompt('Rename project', oldName); if (!name?.trim() || name.trim() === oldName) return; const clean = name.trim(); setProjects(ps => ps.map(p=>p===oldName?clean:p)); setTasks(ts => ts.map(t=>t.project===oldName?{...t, project: clean}:t)); setView(`Project · ${clean}`); };
  const deleteProject = (name: string) => { if (name === 'Inbox') return; if (!window.confirm(`Move tasks from ${name} to Inbox and delete this project?`)) return; setProjects(ps => ps.filter(p=>p!==name)); setTasks(ts => ts.map(t=>t.project===name?{...t, project:'Inbox'}:t)); setView('Inbox'); };
  const activeTask = tasks.find(t => t.id === selectedTask) || null;
  const kanbanColumns: { id: TaskStatus; label: string }[] = [{id:'todo',label:'To Do'}, {id:'doing',label:'Doing'}, {id:'waiting',label:'Waiting'}, {id:'done',label:'Done'}];
  return <section className="module task-layout">
    <div className="pane task-views"><div className="pane-head"><h2>Tasks</h2><button className="icon-btn" onClick={addProject}><Plus size={16}/></button></div>{views.map(v => <button key={v} className={view===v && !dateFilter?'selected':''} onClick={()=>selectView(v)}>{v==='Inbox'?<Inbox/>:v==='Today'?<Clock3/>:v==='Upcoming'?<CalendarDays/>:<FolderKanban/>}<span>{v}</span></button>)}<h3>Projects</h3>{normalisedProjects.filter(p=>p!=='Inbox').map(p=><div className="project-edit-row" key={p}><button onClick={()=>setView(`Project · ${p}`)}>{p}</button><button onClick={()=>renameProject(p)}>Edit</button><button onClick={()=>deleteProject(p)}>Delete</button></div>)}</div>
    <div className="task-main"><div className="hero"><div><p>Natural language quick add</p><h1>{dateFilter ? format(parseISO(dateFilter), 'EEEE, d MMM') : view}</h1></div><div className="quick-add"><Zap size={18}/><input value={quick} onChange={e=>setQuick(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')add();}} placeholder="Submit report next Tuesday at 2pm !high #work"/><button onClick={add}>Add</button></div></div>
      <div className="task-toolbar"><div className="upcoming-strip">{Array.from({length: 7}, (_,i)=>addDays(today,i)).map(d=>{ const key=format(d,'yyyy-MM-dd'); return <button key={d.toISOString()} className={`${iDay(d)} ${dateFilter===key?'selected':''}`} onClick={()=>selectDay(d)}><strong>{format(d,'EEE')}</strong><span>{format(d,'d')}</span></button>; })}</div>{view.startsWith('Project') && <button className={`kanban-toggle ${kanban?'selected':''}`} onClick={()=>setKanban(!kanban)}>Kanban</button>}</div>
      {kanban && view.startsWith('Project') ? <div className="kanban-board">{kanbanColumns.map(col=><div className="kanban-column" key={col.id}><h3>{col.label}</h3>{visible.filter(t=>(t.done?'done':t.status || 'todo')===col.id).map(t=><button className="kanban-card" key={t.id} onClick={()=>setSelectedTask(t.id)}><strong>{t.title}</strong><small>{t.due || 'Anytime'} · {t.priority}</small></button>)}</div>)}</div> : <div className="task-list">{visible.length ? visible.map((t)=><article key={t.id} className="task-card" draggable><GripVertical size={16}/><button className="check" onClick={(e)=>{e.stopPropagation(); toggle(t.id);}}>{t.done?<CheckCircle2/>:<Circle/>}</button><button className="task-body task-open" onClick={()=>setSelectedTask(t.id)}><div className="task-title"><strong>{t.title}</strong><span className={`priority ${t.priority}`}><Flag size={13}/>{t.priority}</span></div><p>{t.notes || 'No additional notes'}</p><div className="chips"><span><CalendarDays size={13}/>{t.due || 'Anytime'}</span><span><FolderKanban size={13}/>{t.project}</span>{t.recurrence?.type && t.recurrence.type !== 'none' && <span><Repeat size={13}/>{t.recurrence.type}</span>}{t.tags.map(tag=><span key={tag}><Tag size={13}/>{tag}</span>)}</div>{t.subtasks.length>0 && <div className="subtasks">{t.subtasks.map(s=><label key={s.id}><input type="checkbox" checked={s.done} readOnly />{s.title}</label>)}</div>}</button><button className="icon-btn" onClick={()=>setSelectedTask(t.id)}><MoreHorizontal/></button></article>) : <div className="empty big-empty">No tasks scheduled for this date.</div>}</div>}
    </div>
    {activeTask && <TaskDetailModal task={activeTask} projects={normalisedProjects} close={()=>setSelectedTask(null)} updateTask={patch=>updateTask(activeTask.id, patch)} />}
  </section>;
}

function TaskDetailModal({ task, projects, updateTask, close }: { task: Task; projects: string[]; updateTask: (patch: Partial<Task>) => void; close: () => void }) {
  const tagsText = task.tags.join(', ');
  const subtasksText = task.subtasks.map(s=>s.title).join('\n');
  const attachmentsText = task.attachments.join('\n');
  return <div className="detail-backdrop" onMouseDown={close}><aside className="detail-drawer" onMouseDown={e=>e.stopPropagation()}><div className="detail-head"><h2>Task details</h2><button className="icon-btn" onClick={close}><X size={16}/></button></div><div className="detail-form"><label>Title<input value={task.title} onChange={e=>updateTask({title:e.target.value})}/></label><label>Project<select value={task.project} onChange={e=>updateTask({project:e.target.value})}>{projects.map(p=><option key={p}>{p}</option>)}</select></label><label>Due date<input type="date" value={task.due || ''} onChange={e=>updateTask({due:e.target.value || undefined})}/></label><label>Priority<select value={task.priority} onChange={e=>updateTask({priority:e.target.value as Priority})}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label><label>Status<select value={task.done ? 'done' : task.status || 'todo'} onChange={e=>updateTask({status:e.target.value as TaskStatus, done:e.target.value==='done', completedAt:e.target.value==='done' ? new Date().toISOString() : undefined})}><option value="todo">To Do</option><option value="doing">Doing</option><option value="waiting">Waiting</option><option value="done">Done</option></select></label><label>Recurrence<select value={task.recurrence?.type || 'none'} onChange={e=>updateTask({recurrence:{type:e.target.value as RecurrenceType, intervalDays: task.recurrence?.intervalDays || 7}})}><option value="none">None</option><option value="daily">Daily</option><option value="weekdays">Weekdays</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="custom">Custom interval</option></select></label>{(task.recurrence?.type || 'none') === 'custom' && <label>Interval days<input type="number" min="1" value={task.recurrence?.intervalDays || 7} onChange={e=>updateTask({recurrence:{type:'custom', intervalDays:Number(e.target.value)||1}})}/></label>}<label>Reminder time<input type="time" value={task.reminder || ''} onChange={e=>updateTask({reminder:e.target.value})}/></label><label>Tags<input value={tagsText} onChange={e=>updateTask({tags:e.target.value.split(',').map(x=>x.trim()).filter(Boolean)})}/></label><label>Notes<textarea value={task.notes} onChange={e=>updateTask({notes:e.target.value})}/></label><label>Subtasks<textarea value={subtasksText} onChange={e=>updateTask({subtasks:e.target.value.split('\n').filter(Boolean).map((title,i)=>task.subtasks[i] ? {...task.subtasks[i], title} : {id:uid(), title, done:false})})}/></label><label>Attachments / links<textarea value={attachmentsText} onChange={e=>updateTask({attachments:e.target.value.split('\n').map(x=>x.trim()).filter(Boolean)})}/></label></div></aside></div>;
}
function iDay(d: Date){ return isToday(d)?'day today':'day'; }

function percentComplete(habit: Habit, days: number) {
  const dates = Array.from({length: days}, (_,i)=>format(addDays(today, -i), 'yyyy-MM-dd'));
  return Math.round((dates.filter(d=>habit.completions.includes(d)).length / days) * 100);
}
function bestWeekday(habit: Habit) {
  const counts = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((label, day)=>({label, count: habit.completions.filter(d=>parseISO(d).getDay()===day).length}));
  return counts.sort((a,b)=>b.count-a.count)[0]?.label || '—';
}
function HabitsModule({ habits, setHabits }: { habits: Habit[]; setHabits: React.Dispatch<React.SetStateAction<Habit[]>> }) {
  const [selected, setSelected] = useState(habits[0]?.id || '');
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const day = format(today, 'yyyy-MM-dd');
  const habit = habits.find(h=>h.id===selected) || habits[0];
  useEffect(() => { if (!habits.some(h => h.id === selected)) setSelected(habits[0]?.id || ''); }, [habits, selected]);
  const toggle = (id: string) => setHabits(hs=>hs.map(h=> { if (h.id !== id) return h; const done = h.completions.includes(day); const current = done ? Math.max(0, h.current - 1) : h.current + 1; return { ...h, completions: done ? h.completions.filter(d=>d!==day) : [day, ...h.completions], current, longest: done ? h.longest : Math.max(h.longest, current) }; }));
  const saveHabit = (next: Habit) => { setHabits(hs => hs.some(h=>h.id===next.id) ? hs.map(h=>h.id===next.id?next:h) : [next, ...hs]); setSelected(next.id); setEditing(null); };
  const addHabit = () => setEditing('new');
  const updateHabit = (patch: Partial<Habit>) => habit && setHabits(hs=>hs.map(h=>h.id===habit.id?{...h,...patch}:h));
  const deleteHabit = () => { if(!habit) return; setHabits(hs=>{ const next=hs.filter(h=>h.id!==habit.id); setSelected(next[0]?.id || ''); return next; }); };
  if (!habit) return <section className="module"><button className="pill-btn" onClick={addHabit}><Plus size={16}/> New habit</button>{editing==='new' && <HabitModal habit={null} save={saveHabit} close={()=>setEditing(null)} />}</section>;
  return <section className="module habits-layout">
    <div className="habit-dashboard"><div className="hero"><div><p>Frictionless daily logging</p><h1>Habit Dashboard</h1></div><button className="pill-btn" onClick={addHabit}><Plus size={16}/> New habit</button></div><div className="habit-grid">{habits.map(h=><article key={h.id} className={`habit-tile ${h.id===selected?'selected':''}`} style={{'--habit':h.color} as React.CSSProperties} onClick={()=>setSelected(h.id)}><button className="habit-select-area" onClick={()=>setSelected(h.id)}><span className="habit-icon">{h.icon}</span><strong>{h.name}</strong><small>{h.cadence}</small><div className="completion-ring">{h.completions.includes(day)?<CheckCircle2/>:<Circle/>}</div><div className="streak"><Flame size={15}/>{h.current} day streak</div></button><div className="habit-actions"><button className="log-btn" onClick={(e)=>{e.stopPropagation(); toggle(h.id);}}>{h.completions.includes(day) ? 'Logged today' : 'Log today'}</button><button className="icon-btn" onClick={(e)=>{e.stopPropagation(); setEditing(h.id);}}><Settings2 size={15}/></button></div></article>)}</div></div>
    <div className="habit-stats"><h2>{habit.icon} {habit.name}</h2><div className="metric-row"><div><strong>{habit.current}</strong><span>Current streak</span></div><div><strong>{habit.longest}</strong><span>Longest streak</span></div></div><h3>Analytics</h3><div className="analytics-grid"><div><strong>{percentComplete(habit,7)}%</strong><span>7 days</span></div><div><strong>{percentComplete(habit,30)}%</strong><span>30 days</span></div><div><strong>{percentComplete(habit,90)}%</strong><span>90 days</span></div><div><strong>{bestWeekday(habit)}</strong><span>Best day</span></div></div><h3>Edit habit</h3><div className="edit-form"><button className="pill-btn" onClick={()=>setEditing(habit.id)}>Open habit editor</button><button className="danger-btn" onClick={deleteHabit}><X size={14}/> Delete habit</button></div><h3>Calendar heatmap</h3><div className="heatmap labelled">{Array.from({length: 112}, (_,i)=>format(addDays(today, i-111),'yyyy-MM-dd')).map(d=><span key={d} className={habit.completions.includes(d)?'hit':''} title={d}/>)}</div><div className="stats-card"><Trophy/> {habit.type || 'binary'} habit · {habit.frequency || habit.cadence} · goal {habit.goalAmount || 1}</div></div>
    {editing && <HabitModal habit={editing === 'new' ? null : habits.find(h=>h.id===editing) || null} save={saveHabit} close={()=>setEditing(null)} />}
  </section>;
}
function HabitModal({ habit, save, close }: { habit: Habit | null; save: (habit: Habit)=>void; close: ()=>void }) {
  const [draft, setDraft] = useState<Habit>(habit || { id: uid(), name: 'New Habit', icon: '⭐', cadence: 'Daily', current: 0, longest: 0, completions: [], color: '#7c5cff', type: 'binary', goalAmount: 1, frequency: 'daily', reminder: '' });
  return <div className="detail-backdrop" onMouseDown={close}><aside className="detail-drawer" onMouseDown={e=>e.stopPropagation()}><div className="detail-head"><h2>{habit?'Edit habit':'Create habit'}</h2><button className="icon-btn" onClick={close}><X size={16}/></button></div><div className="detail-form"><label>Name<input value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/></label><label>Icon<input value={draft.icon} maxLength={2} onChange={e=>setDraft({...draft,icon:e.target.value || '⭐'})}/></label><label>Colour<input type="color" value={draft.color} onChange={e=>setDraft({...draft,color:e.target.value})}/></label><label>Frequency<select value={draft.frequency || 'daily'} onChange={e=>setDraft({...draft,frequency:e.target.value,cadence:e.target.value})}><option value="daily">Daily</option><option value="weekdays">Weekdays</option><option value="specific weekdays">Specific weekdays</option><option value="times per week">X times per week</option><option value="monthly">Monthly</option></select></label><label>Habit type<select value={draft.type || 'binary'} onChange={e=>setDraft({...draft,type:e.target.value as HabitType})}><option value="binary">Binary</option><option value="count">Count</option><option value="duration">Duration</option></select></label><label>Goal amount<input type="number" min="1" value={draft.goalAmount || 1} onChange={e=>setDraft({...draft,goalAmount:Number(e.target.value)||1})}/></label><label>Reminder time<input type="time" value={draft.reminder || ''} onChange={e=>setDraft({...draft,reminder:e.target.value})}/></label><button className="primary-action" onClick={()=>save(draft)}>Save habit</button></div></aside></div>;
}

function Sparkline({ values }: { values: number[] }) { const max=Math.max(...values, 1); const pts=values.map((v,i)=>`${(i/(Math.max(values.length-1,1)))*160},${50-(v/max)*42}`).join(' '); return <svg viewBox="0 0 160 56" className="spark"><polyline points={pts}/></svg>; }
function formatTimer(seconds: number) { const m = Math.floor(seconds / 60).toString().padStart(2,'0'); const s = (seconds % 60).toString().padStart(2,'0'); return `${m}:${s}`; }
function estimatedOneRepMax(weight: number, reps: number) { return Math.round(weight * (1 + reps / 30)); }
function exercisePr(exerciseId: string, sessions: WorkoutSession[]) {
  const sets = sessions.flatMap(s => s.sets.filter(set => set.exerciseId === exerciseId && set.done));
  const maxWeight = Math.max(0, ...sets.map(s => s.weight || 0));
  const maxReps = Math.max(0, ...sets.map(s => s.reps || 0));
  const maxOneRm = Math.max(0, ...sets.map(s => estimatedOneRepMax(s.weight || 0, s.reps || 0)));
  const volume = sets.reduce((sum, s) => sum + ((s.weight || 0) * (s.reps || 0)), 0);
  return { maxWeight, maxReps, maxOneRm, volume };
}
function WorkoutsModule({ exerciseList, setExerciseList, routineList, setRoutineList, workoutSessions, setWorkoutSessions }: { exerciseList: Exercise[]; setExerciseList: React.Dispatch<React.SetStateAction<Exercise[]>>; routineList: Routine[]; setRoutineList: React.Dispatch<React.SetStateAction<Routine[]>>; workoutSessions: WorkoutSession[]; setWorkoutSessions: React.Dispatch<React.SetStateAction<WorkoutSession[]>> }) {
  const [routine, setRoutine] = useState(routineList[0]?.id || '');
  const [workoutMode, setWorkoutMode] = useState(false);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [sessionNotes, setSessionNotes] = useState('');
  const active = routineList.find(r=>r.id===routine) || routineList[0];
  const activeExercises = active?.exercises.map(id=>exerciseList.find(e=>e.id===id)).filter(Boolean) as Exercise[] || [];
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(activeExercises[0]?.rest || 120);
  const [timerDraft, setTimerDraft] = useState(activeExercises[0]?.rest || 120);
  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const timerPresets = [30, 45, 60, 90, 120, 180, 240, 300];
  useEffect(() => { if (!running) return; const timer = window.setInterval(()=>setSeconds(s=>{ if (s <= 1) { setRunning(false); return 0; } return s - 1; }), 1000); return () => window.clearInterval(timer); }, [running]);
  useEffect(() => { const next = activeExercises[0]?.rest || 120; setSeconds(next); setTimerDraft(next); setRunning(false); setExerciseIndex(0); setSets([]); }, [routine]);
  useEffect(() => { if (!routineList.some(r => r.id === routine)) setRoutine(routineList[0]?.id || ''); }, [routineList, routine]);
  const setTimer = (value: number, start = false) => { const safe = Math.max(1, Math.round(value || 1)); setSeconds(safe); setTimerDraft(safe); setRunning(start); };
  const updateRoutine = (patch: Partial<Routine>) => setRoutineList(rs=>rs.map(r=>r.id===active.id?{...r,...patch}:r));
  const addRoutine = () => { const id=uid(); setRoutineList(rs=>[{id,name:'New Routine',exercises:[]},...rs]); setRoutine(id); };
  const addExercise = () => { if (!active) return; const id=uid(); const ex: Exercise = { id, name:'New Exercise', group:'Custom', instructions:'Add instructions', previous:'—', rest:90, history:[0] }; setExerciseList(es=>[ex,...es]); updateRoutine({exercises:[...active.exercises,id]}); };
  const addExistingToRoutine = (id: string) => { if (active && !active.exercises.includes(id)) updateRoutine({exercises:[...active.exercises,id]}); };
  const updateExercise = (id: string, patch: Partial<Exercise>) => setExerciseList(es=>es.map(e=>e.id===id?{...e,...patch}:e));
  const removeExerciseFromRoutine = (id: string) => active && updateRoutine({exercises:active.exercises.filter(eid=>eid!==id)});
  const updateSet = (exerciseId: string, set: number, patch: Partial<WorkoutSet>) => setSets(existing => {
    const found = existing.find(s => s.exerciseId === exerciseId && s.set === set);
    if (found) return existing.map(s => s.exerciseId === exerciseId && s.set === set ? { ...s, ...patch } : s);
    return [...existing, { exerciseId, set, weight: 0, reps: 0, done: false, ...patch }];
  });
  const completeSet = (exercise: Exercise, set: number) => { updateSet(exercise.id, set, { done: true }); setTimer(exercise.rest, true); };
  const completeWorkout = () => {
    if (!active) return;
    const session: WorkoutSession = { id: uid(), routineId: active.id, routineName: active.name, date: new Date().toISOString(), duration: 0, notes: sessionNotes, sets: sets.filter(s=>s.done || s.weight || s.reps) };
    setWorkoutSessions(sessions => [session, ...sessions]);
    setWorkoutMode(false); setSessionNotes(''); setSets([]); setRunning(false);
  };
  if (!active) return <section className="module"><button className="pill-btn" onClick={addRoutine}><Plus size={16}/> New routine</button></section>;
  const currentExercise = activeExercises[exerciseIndex];
  if (workoutMode) return <section className="module workout-focus"><div className="focus-card"><div className="hero workout-hero"><div><p>Workout mode</p><h1>{active.name}</h1></div><div className="timer"><TimerReset size={18}/><strong>{formatTimer(seconds)}</strong><button onClick={()=>setRunning(!running)}>{running?<Pause size={15}/>:<Play size={15}/>}</button></div></div>{currentExercise ? <div className="focus-exercise"><h2>{currentExercise.name}</h2><p>{currentExercise.instructions}</p>{[1,2,3,4].map(set => { const current = sets.find(s=>s.exerciseId===currentExercise.id && s.set===set); return <div className="focus-set" key={set}><strong>Set {set}</strong><input type="number" placeholder="kg" value={current?.weight || ''} onChange={e=>updateSet(currentExercise.id,set,{weight:Number(e.target.value)||0})}/><input type="number" placeholder="reps" value={current?.reps || ''} onChange={e=>updateSet(currentExercise.id,set,{reps:Number(e.target.value)||0})}/><button className={current?.done?'done':''} onClick={()=>completeSet(currentExercise,set)}>{current?.done?'Done':'Complete'}</button></div>; })}<div className="focus-nav"><button onClick={()=>setExerciseIndex(Math.max(0, exerciseIndex-1))}>Previous</button><button onClick={()=>setExerciseIndex(Math.min(activeExercises.length-1, exerciseIndex+1))}>Next</button></div></div> : <div className="empty big-empty">No exercises in this routine.</div>}<textarea className="exercise-instructions" placeholder="Workout notes" value={sessionNotes} onChange={e=>setSessionNotes(e.target.value)}/><div className="focus-actions"><button className="pill-btn" onClick={()=>setWorkoutMode(false)}>Exit workout mode</button><button className="primary-action" onClick={completeWorkout}>Save workout</button></div></div></section>;
  return <section className="module workout-layout"><div className="pane routines"><div className="pane-head"><h2>Routines</h2><button className="icon-btn" onClick={addRoutine}><Plus size={16}/></button></div>{routineList.map(r=><button key={r.id} onClick={()=>setRoutine(r.id)} className={routine===r.id?'selected':''}><Dumbbell size={17}/><span>{r.name}</span><small>{r.exercises.length} exercises</small></button>)}<h3>Exercise Library</h3>{exerciseList.map(e=><button key={e.id} className="exercise-mini" onClick={()=>addExistingToRoutine(e.id)}><Activity size={14}/><span>{e.name}</span><small>{e.group}</small></button>)}</div><div className="workout-main"><div className="hero workout-hero"><div><p>Workout logging</p><input className="routine-title-input" value={active.name} onChange={e=>updateRoutine({name:e.target.value})}/></div><div className="timer"><TimerReset size={18}/><strong>{formatTimer(seconds)}</strong><button onClick={()=>setRunning(!running)}>{running?<Pause size={15}/>:<Play size={15}/>}</button><button onClick={()=>setTimer(timerDraft, false)}>Reset</button></div></div><div className="timer-controls"><span>Timer presets</span>{timerPresets.map(p=><button key={p} className={timerDraft===p?'selected':''} onClick={()=>setTimer(p, false)}>{p < 60 ? `${p}s` : `${p/60}m`}</button>)}<label>Custom <input type="number" min="1" value={timerDraft} onChange={e=>setTimerDraft(Number(e.target.value) || 1)} onBlur={()=>setTimer(timerDraft,false)}/> sec</label></div><div className="workout-toolbar"><button className="primary-action" onClick={()=>setWorkoutMode(true)}>Start workout mode</button><button className="pill-btn workout-add" onClick={addExercise}><Plus size={16}/> Add custom exercise</button></div>{activeExercises.map(ex=>{ const pr=exercisePr(ex.id, workoutSessions); return <article className="exercise-card" key={ex.id}><div className="exercise-head"><div><input className="exercise-name-input" value={ex.name} onChange={e=>updateExercise(ex.id,{name:e.target.value})}/><textarea className="exercise-instructions" value={ex.instructions} onChange={e=>updateExercise(ex.id,{instructions:e.target.value})}/><div className="pr-row"><span>Max {pr.maxWeight || '—'}kg</span><span>Reps {pr.maxReps || '—'}</span><span>1RM {pr.maxOneRm || '—'}</span><span>Volume {pr.volume || '—'}</span></div></div><div><label className="rest-input">Rest <input type="number" value={ex.rest} onChange={e=>updateExercise(ex.id,{rest:Number(e.target.value) || 1})}/>s</label><Sparkline values={ex.history}/><button className="danger-btn small" onClick={()=>removeExerciseFromRoutine(ex.id)}><X size={13}/> Remove</button></div></div><table><thead><tr><th>Set</th><th>Previous</th><th>kg</th><th>Reps</th><th>Done</th></tr></thead><tbody>{[1,2,3,4].map(set=>{ const current=sets.find(s=>s.exerciseId===ex.id && s.set===set); return <tr key={set}><td>{set}</td><td><input className="previous-input" value={ex.previous} onChange={e=>updateExercise(ex.id,{previous:e.target.value})}/></td><td><input type="number" placeholder="—" value={current?.weight || ''} onChange={e=>updateSet(ex.id,set,{weight:Number(e.target.value)||0})}/></td><td><input type="number" placeholder="—" value={current?.reps || ''} onChange={e=>updateSet(ex.id,set,{reps:Number(e.target.value)||0})}/></td><td><input type="checkbox" checked={Boolean(current?.done)} onChange={()=>completeSet(ex,set)} /></td></tr>; })}</tbody></table></article>; })}</div><div className="progress-panel"><h2><LineChart/> Progression</h2><p>Track personal records and recent workout history.</p>{exerciseList.slice(0,4).map(e=>{ const pr=exercisePr(e.id, workoutSessions); return <div key={e.id} className="progress-row"><span>{e.name}</span><Sparkline values={e.history}/><strong>{pr.maxOneRm || Math.max(...e.history)}</strong></div>; })}<h3>Workout History</h3>{workoutSessions.length ? workoutSessions.slice(0,6).map(s=><div className="history-row" key={s.id}><strong>{s.routineName}</strong><span>{format(parseISO(s.date),'d MMM yyyy')}</span><small>{s.sets.length} sets</small></div>) : <div className="empty">No saved workouts yet.</div>}</div></section>;
}


function dayKey(value: string) { return value.slice(0, 10); }
function splitLines(value: string) { return value.split('\n').map(x=>x.trim()).filter(Boolean); }
function JournalModule({ journalEntries, setJournalEntries, habits, tasks, workoutSessions }: { journalEntries: JournalEntry[]; setJournalEntries: React.Dispatch<React.SetStateAction<JournalEntry[]>>; habits: Habit[]; tasks: Task[]; workoutSessions: WorkoutSession[] }) {
  const [date, setDate] = useState(format(today, 'yyyy-MM-dd'));
  const entry = journalEntries.find(j => j.date === date) || { id: uid(), date, mood: 3, energy: 3, sleep: 3, wins: '', challenges: '', gratitude: '', notes: 'Prompt: What mattered today?\nPrompt: What should tomorrow inherit from today?' };
  const save = (patch: Partial<JournalEntry>) => setJournalEntries(js => { const next = { ...entry, ...patch, date }; return js.some(j=>j.date===date) ? js.map(j=>j.date===date?next:j) : [next, ...js]; });
  const completedHabits = habits.filter(h => h.completions.includes(date));
  const completedTasks = tasks.filter(t => t.done && ((t.completedAt && dayKey(t.completedAt) === date) || (!t.completedAt && t.due === date)));
  const dayWorkouts = workoutSessions.filter(w => dayKey(w.date) === date);
  const go = (days: number) => setDate(format(addDays(parseISO(date), days), 'yyyy-MM-dd'));
  return <section className="module os-layout journal-module"><div className="os-main"><div className="hero"><div><p>Daily reflection</p><h1>{format(parseISO(date), 'EEEE, d MMMM')}</h1></div><div className="date-nav"><button onClick={()=>setDate(format(today,'yyyy-MM-dd'))}>Today</button><button onClick={()=>go(-1)}>Previous</button><button onClick={()=>go(1)}>Next</button><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></div></div><div className="journal-grid"><label><Smile/> Mood <input type="range" min="1" max="5" value={entry.mood} onChange={e=>save({mood:Number(e.target.value)})}/><strong>{entry.mood}/5</strong></label><label><Battery/> Energy <input type="range" min="1" max="5" value={entry.energy} onChange={e=>save({energy:Number(e.target.value)})}/><strong>{entry.energy}/5</strong></label><label><Bed/> Sleep <input type="range" min="1" max="5" value={entry.sleep} onChange={e=>save({sleep:Number(e.target.value)})}/><strong>{entry.sleep}/5</strong></label></div><div className="journal-editor"><label>Wins<textarea value={entry.wins} onChange={e=>save({wins:e.target.value})} placeholder="What went well today?"/></label><label>Challenges<textarea value={entry.challenges} onChange={e=>save({challenges:e.target.value})} placeholder="What was hard or needs attention?"/></label><label>Gratitude<textarea value={entry.gratitude} onChange={e=>save({gratitude:e.target.value})} placeholder="Three things you appreciate."/></label><label className="wide">Freeform notes<textarea value={entry.notes} onChange={e=>save({notes:e.target.value})} placeholder="Use this space however you want. Prompts are editable."/></label></div></div><aside className="os-side"><DashboardCard title="Linked day activity"><h3>Habits completed</h3>{completedHabits.length ? completedHabits.map(h=><div className="dash-row" key={h.id}><span>{h.icon} {h.name}</span><strong>done</strong></div>) : <p className="muted-line">No habits logged.</p>}<h3>Tasks completed</h3>{completedTasks.length ? completedTasks.map(t=><DashboardTask key={t.id} task={t}/>) : <p className="muted-line">No tasks completed.</p>}<h3>Workouts</h3>{dayWorkouts.length ? dayWorkouts.map(w=><div className="dash-row" key={w.id}><span>{w.routineName}</span><strong>{w.sets.length} sets</strong></div>) : <p className="muted-line">No workout logged.</p>}</DashboardCard><DashboardCard title="Recent entries">{journalEntries.slice(0,8).map(j=><button className="recent-note" key={j.id} onClick={()=>setDate(j.date)}><PenLine size={15}/><span>{format(parseISO(j.date),'d MMM yyyy')}</span><small>Mood {j.mood}/5</small></button>)}</DashboardCard></aside></section>;
}
function CalendarModule({ tasks, habits, workoutSessions, journalEntries, notes, setModule }: { tasks: Task[]; habits: Habit[]; workoutSessions: WorkoutSession[]; journalEntries: JournalEntry[]; notes: Note[]; setModule: (m: Module)=>void }) {
  const [view, setView] = useState<'month'|'agenda'>('month'); const [cursor, setCursor] = useState(format(today,'yyyy-MM-dd')); const [selected, setSelected] = useState(format(today,'yyyy-MM-dd'));
  const monthStart = new Date(parseISO(cursor).getFullYear(), parseISO(cursor).getMonth(), 1); const gridStart = addDays(monthStart, -monthStart.getDay());
  const dayData = (d: string) => ({ tasks: tasks.filter(t=>t.due===d), habits: habits.filter(h=>h.completions.includes(d)), workouts: workoutSessions.filter(w=>dayKey(w.date)===d), journal: journalEntries.find(j=>j.date===d), notes: notes.filter(n=>n.body.includes(d) || n.title.includes(d)) });
  const selectedData = dayData(selected);
  const agenda = Array.from({length:45},(_,i)=>format(addDays(today,i-7),'yyyy-MM-dd')).flatMap(d=>{ const dd=dayData(d); return [...dd.tasks.map(t=>({d,type:'Task',label:t.title})),...dd.workouts.map(w=>({d,type:'Workout',label:w.routineName})),...(dd.journal?[{d,type:'Journal',label:'Journal entry'}]:[])]; }).sort((a,b)=>a.d.localeCompare(b.d));
  return <section className="module os-layout calendar-module"><div className="os-main"><div className="hero"><div><p>Unified schedule</p><h1>{format(parseISO(cursor),'MMMM yyyy')}</h1></div><div className="date-nav"><button onClick={()=>setCursor(format(addDays(parseISO(cursor),-30),'yyyy-MM-dd'))}>Previous</button><button onClick={()=>setCursor(format(today,'yyyy-MM-dd'))}>Today</button><button onClick={()=>setCursor(format(addDays(parseISO(cursor),30),'yyyy-MM-dd'))}>Next</button><button className={view==='month'?'selected':''} onClick={()=>setView('month')}>Month</button><button className={view==='agenda'?'selected':''} onClick={()=>setView('agenda')}>Agenda</button></div></div>{view==='month'?<div className="calendar-grid">{Array.from({length:42},(_,i)=>addDays(gridStart,i)).map(d=>{ const key=format(d,'yyyy-MM-dd'); const data=dayData(key); return <button key={key} className={`calendar-day ${key===selected?'selected':''} ${d.getMonth()!==monthStart.getMonth()?'muted':''}`} onClick={()=>setSelected(key)}><strong>{format(d,'d')}</strong><span>{data.tasks.length ? `${data.tasks.length} tasks` : ''}</span><span>{data.habits.length ? `${data.habits.length} habits` : ''}</span><span>{data.workouts.length ? 'Workout' : ''}</span><span>{data.journal ? 'Journal' : ''}</span></button>; })}</div>:<div className="agenda-list">{agenda.map((a,i)=><button key={`${a.d}-${a.type}-${i}`} onClick={()=>setSelected(a.d)}><strong>{format(parseISO(a.d),'d MMM')}</strong><span>{a.type}</span><p>{a.label}</p></button>)}</div>}</div><aside className="os-side"><DashboardCard title={format(parseISO(selected),'EEEE, d MMM')} action="Journal" onAction={()=>setModule('journal')}><h3>Tasks</h3>{selectedData.tasks.length ? selectedData.tasks.map(t=><DashboardTask key={t.id} task={t}/>) : <p className="muted-line">No tasks.</p>}<h3>Habits</h3>{selectedData.habits.length ? selectedData.habits.map(h=><div className="dash-row" key={h.id}><span>{h.icon} {h.name}</span><strong>done</strong></div>) : <p className="muted-line">No habit completions.</p>}<h3>Workouts</h3>{selectedData.workouts.length ? selectedData.workouts.map(w=><div className="dash-row" key={w.id}><span>{w.routineName}</span><strong>{w.sets.length}</strong></div>) : <p className="muted-line">No workouts.</p>}<h3>Journal</h3>{selectedData.journal ? <p>{selectedData.journal.wins || 'Journal entry exists.'}</p> : <p className="muted-line">No journal entry.</p>}<h3>Linked notes</h3>{selectedData.notes.length ? selectedData.notes.map(n=><div className="dash-row" key={n.id}><span>{n.title}</span><strong>note</strong></div>) : <p className="muted-line">No date-linked notes.</p>}</DashboardCard></aside></section>;
}
function GoalsModule({ goals, setGoals, notes, tasks, habits, routineList, projects }: { goals: Goal[]; setGoals: React.Dispatch<React.SetStateAction<Goal[]>>; notes: Note[]; tasks: Task[]; habits: Habit[]; routineList: Routine[]; projects: string[] }) {
  const [selected, setSelected] = useState(goals[0]?.id || ''); const goal = goals.find(g=>g.id===selected) || goals[0];
  useEffect(()=>{ if(!goals.some(g=>g.id===selected)) setSelected(goals[0]?.id || ''); },[goals,selected]);
  const add = () => { const id=uid(); setGoals(gs=>[{id,title:'New Goal',description:'',status:'active',targetDate:'',linkedNotes:[],linkedTasks:[],linkedHabits:[],linkedRoutines:[],linkedProjects:[],progress:0,milestones:[]},...gs]); setSelected(id); };
  const update = (patch: Partial<Goal>) => goal && setGoals(gs=>gs.map(g=>g.id===goal.id?{...g,...patch}:g));
  const del = () => goal && window.confirm('Delete this goal?') && setGoals(gs=>gs.filter(g=>g.id!==goal.id));
  const setLinks = (key: keyof Pick<Goal,'linkedNotes'|'linkedTasks'|'linkedHabits'|'linkedRoutines'|'linkedProjects'>, value: string[]) => update({[key]: value} as Partial<Goal>);
  if(!goal) return <section className="module"><button className="pill-btn" onClick={add}><Plus size={16}/> New goal</button></section>;
  return <section className="module goals-module"><div className="pane goal-list"><div className="pane-head"><h2>Goals</h2><button className="icon-btn" onClick={add}><Plus size={16}/></button></div>{goals.map(g=><button className={g.id===goal.id?'selected':''} key={g.id} onClick={()=>setSelected(g.id)}><Target size={16}/><span>{g.title}</span><small>{g.progress}% · {g.status}</small></button>)}</div><div className="os-main"><div className="hero"><div><p>Outcome operating system</p><input className="routine-title-input" value={goal.title} onChange={e=>update({title:e.target.value})}/></div><button className="danger-btn" onClick={del}><X size={14}/> Delete</button></div><div className="goal-form"><label>Description<textarea value={goal.description} onChange={e=>update({description:e.target.value})}/></label><label>Status<select value={goal.status} onChange={e=>update({status:e.target.value as GoalStatus})}><option value="not-started">Not started</option><option value="active">Active</option><option value="paused">Paused</option><option value="completed">Completed</option></select></label><label>Target date<input type="date" value={goal.targetDate || ''} onChange={e=>update({targetDate:e.target.value})}/></label><label>Progress<input type="range" min="0" max="100" value={goal.progress} onChange={e=>update({progress:Number(e.target.value)})}/><strong>{goal.progress}%</strong></label></div><h3>Milestones</h3><div className="milestones">{goal.milestones.map(m=><label key={m.id}><input type="checkbox" checked={m.done} onChange={e=>update({milestones:goal.milestones.map(x=>x.id===m.id?{...x,done:e.target.checked}:x)})}/><input value={m.title} onChange={e=>update({milestones:goal.milestones.map(x=>x.id===m.id?{...x,title:e.target.value}:x)})}/></label>)}<button className="pill-btn" onClick={()=>update({milestones:[...goal.milestones,{id:uid(),title:'New milestone',done:false}]})}><Plus size={14}/> Add milestone</button></div></div><aside className="os-side"><LinkPicker title="Projects" items={projects.map(p=>({id:p,label:p}))} selected={goal.linkedProjects} onChange={v=>setLinks('linkedProjects',v)}/><LinkPicker title="Notes" items={notes.map(n=>({id:n.id,label:n.title || 'Untitled'}))} selected={goal.linkedNotes} onChange={v=>setLinks('linkedNotes',v)}/><LinkPicker title="Tasks" items={tasks.map(t=>({id:t.id,label:t.title}))} selected={goal.linkedTasks} onChange={v=>setLinks('linkedTasks',v)}/><LinkPicker title="Habits" items={habits.map(h=>({id:h.id,label:h.name}))} selected={goal.linkedHabits} onChange={v=>setLinks('linkedHabits',v)}/><LinkPicker title="Routines" items={routineList.map(r=>({id:r.id,label:r.name}))} selected={goal.linkedRoutines} onChange={v=>setLinks('linkedRoutines',v)}/></aside></section>;
}
function LinkPicker({ title, items, selected, onChange }: { title: string; items: {id:string; label:string}[]; selected: string[]; onChange: (ids:string[])=>void }) { return <DashboardCard title={title}>{items.slice(0,8).map(item=><label className="link-check" key={item.id}><input type="checkbox" checked={selected.includes(item.id)} onChange={e=>onChange(e.target.checked ? [...selected,item.id] : selected.filter(id=>id!==item.id))}/><span>{item.label}</span></label>)}</DashboardCard>; }
function ResourcesModule({ resources, setResources, notes, goals, projects }: { resources: ResourceItem[]; setResources: React.Dispatch<React.SetStateAction<ResourceItem[]>>; notes: Note[]; goals: Goal[]; projects: string[] }) {
  const [selected, setSelected] = useState(resources[0]?.id || ''); const [query,setQuery]=useState(''); const resource = resources.find(r=>r.id===selected) || resources[0];
  useEffect(()=>{ if(!resources.some(r=>r.id===selected)) setSelected(resources[0]?.id || ''); },[resources,selected]);
  const add=()=>{const id=uid(); setResources(rs=>[{id,title:'New Resource',url:'',description:'',tags:[],createdAt:new Date().toISOString()},...rs]); setSelected(id);};
  const update=(patch:Partial<ResourceItem>)=>resource&&setResources(rs=>rs.map(r=>r.id===resource.id?{...r,...patch}:r)); const del=()=>resource&&window.confirm('Delete this resource?')&&setResources(rs=>rs.filter(r=>r.id!==resource.id));
  const filtered=resources.filter(r=>`${r.title} ${r.url} ${r.description} ${r.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase()));
  if(!resource) return <section className="module"><button className="pill-btn" onClick={add}><Plus size={16}/> New resource</button></section>;
  return <section className="module resources-module"><div className="pane resource-list"><div className="pane-head"><h2>Resources</h2><button className="icon-btn" onClick={add}><Plus size={16}/></button></div><div className="search"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search resources"/></div>{filtered.map(r=><button className={r.id===resource.id?'selected':''} key={r.id} onClick={()=>setSelected(r.id)}><Library size={16}/><span>{r.title}</span><small>{r.tags.join(', ') || r.url || 'Reference'}</small></button>)}</div><div className="os-main"><div className="hero"><div><p>Resource library</p><input className="routine-title-input" value={resource.title} onChange={e=>update({title:e.target.value})}/></div>{resource.url && <a className="pill-btn" href={resource.url} target="_blank" rel="noreferrer"><ExternalLink size={15}/> Open</a>}</div><div className="resources-form"><label>URL<input value={resource.url} onChange={e=>update({url:e.target.value})} placeholder="https://..."/></label><label>Description<textarea value={resource.description} onChange={e=>update({description:e.target.value})}/></label><label>Tags<input value={resource.tags.join(', ')} onChange={e=>update({tags:e.target.value.split(',').map(x=>x.trim()).filter(Boolean)})}/></label><label>Linked project<select value={resource.linkedProject || ''} onChange={e=>update({linkedProject:e.target.value || undefined})}><option value="">None</option>{projects.map(p=><option key={p}>{p}</option>)}</select></label><label>Linked goal<select value={resource.linkedGoal || ''} onChange={e=>update({linkedGoal:e.target.value || undefined})}><option value="">None</option>{goals.map(g=><option value={g.id} key={g.id}>{g.title}</option>)}</select></label><label>Linked note<select value={resource.linkedNote || ''} onChange={e=>update({linkedNote:e.target.value || undefined})}><option value="">None</option>{notes.map(n=><option value={n.id} key={n.id}>{n.title || 'Untitled'}</option>)}</select></label><button className="danger-btn" onClick={del}><X size={14}/> Delete resource</button></div></div></section>;
}

createRoot(document.getElementById('root')!).render(<App />);
