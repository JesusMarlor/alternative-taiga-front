import { create } from 'zustand';
import { Project, ProjectMember } from '../types/taiga';
import { getProjects, getProjectBySlug, getProjectMemberships } from '../api/projects';

interface ProjectState {
  currentProject: Project | null;
  projects: Project[];
  memberships: ProjectMember[];
  isLoading: boolean;
  error: string | null;
  fetchProjects: () => Promise<Project[]>;
  selectProjectBySlug: (slug: string) => Promise<Project>;
  setCurrentProject: (project: Project) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  currentProject: null,
  projects: [],
  memberships: [],
  isLoading: false,
  error: null,

  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const projects = await getProjects();
      set({ projects, isLoading: false });
      return projects;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return [];
    }
  },

  selectProjectBySlug: async (slug: string) => {
    // If already loaded and matching slug, return it
    const current = get().currentProject;
    if (current && current.slug === slug) {
      return current;
    }

    set({ isLoading: true, error: null });
    try {
      const project = await getProjectBySlug(slug);
      let memberships: ProjectMember[] = [];
      try {
        memberships = await getProjectMemberships(project.id);
      } catch (e) {
        console.warn('Could not load memberships', e);
      }

      set({
        currentProject: project,
        memberships,
        isLoading: false,
      });

      return project;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  setCurrentProject: (project) => {
    set({ currentProject: project });
  },
}));
