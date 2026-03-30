import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "convex/_generated/dataModel";

export const useAnnouncements = () => {
  const announcements = useQuery(api.backend.announcements.getAnnouncements, { limit: 20 });
  const getById = (id: Id<"announcements">) => useQuery(api.backend.announcements.getAnnouncementById, { announcementId: id });
  
  return { announcements, getById };
};

export const useCreateAnnouncement = () => {
  return useMutation(api.backend.announcements.createAnnouncement);
};

export const useUpdateAnnouncement = () => {
  return useMutation(api.backend.announcements.updateAnnouncement);
};

export const useDeleteAnnouncement = () => {
  return useMutation(api.backend.announcements.deleteAnnouncement);
};
