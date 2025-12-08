
import { db } from '../config/firebase';
import { collection, getDocs, setDoc, doc, deleteDoc, updateDoc, getDoc } from 'firebase/firestore';
import { StudioTemplate } from '../types';

const COLLECTION_NAME = "studio_templates";

export const getAllStudioTemplates = async (): Promise<StudioTemplate[]> => {
    try {
        const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
        const templates: StudioTemplate[] = [];
        querySnapshot.forEach((doc) => {
            templates.push(doc.data() as StudioTemplate);
        });
        return templates.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (error) {
        console.error("Error fetching studio templates:", error);
        return [];
    }
};

export const getStudioTemplateById = async (id: string): Promise<StudioTemplate | null> => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? (docSnap.data() as StudioTemplate) : null;
    } catch (error) {
        console.error("Error fetching studio template:", error);
        return null;
    }
};

export const saveStudioTemplate = async (template: StudioTemplate) => {
    try {
        await setDoc(doc(db, COLLECTION_NAME, template.id), {
            ...template,
            updatedAt: Date.now()
        });
        return true;
    } catch (error) {
        console.error("Error saving studio template:", error);
        return false;
    }
};

export const deleteStudioTemplate = async (id: string) => {
    try {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
        return true;
    } catch (error) {
        console.error("Error deleting studio template:", error);
        return false;
    }
};
