
// services/productService.ts
import { db } from '../config/firebase';
import { collection, getDocs, setDoc, doc, deleteDoc, updateDoc, writeBatch, increment, getDoc } from 'firebase/firestore';
import { LEGO_PARTS } from '../constants'; // Lấy dữ liệu mẫu ban đầu
import type { LegoPart } from '../types';

// Tên collection trong Firebase
const COLLECTION_NAME = "lego_parts";

// 1. Hàm lấy toàn bộ sản phẩm từ Firebase
export const getAllParts = async (): Promise<LegoPart[]> => {
    try {
        const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
        const parts: LegoPart[] = [];
        querySnapshot.forEach((doc) => {
            parts.push(doc.data() as LegoPart);
        });
        
        // Sắp xếp theo trường 'order' (nếu có), sau đó đến tên
        return parts.sort((a, b) => {
            const orderA = a.order ?? 9999; // Default to end if undefined
            const orderB = b.order ?? 9999;
            if (orderA !== orderB) return orderA - orderB;
            return a.name.localeCompare(b.name);
        });
    } catch (error: any) {
        if (error.code === 'permission-denied') {
             console.warn("Firestore: Không có quyền đọc 'lego_parts'. Dùng dữ liệu mẫu.");
             return [];
        }
        console.error("Lỗi lấy danh sách sản phẩm:", error);
        return [];
    }
};

// 2. Hàm thêm sản phẩm mới
export const addPart = async (part: LegoPart) => {
    try {
        // Dùng part.id làm ID document luôn cho dễ quản lý
        await setDoc(doc(db, COLLECTION_NAME, part.id), part);
        return true;
    } catch (error) {
        console.error("Lỗi thêm sản phẩm:", error);
        return false;
    }
};

// 3. Hàm sửa sản phẩm
export const updatePart = async (partId: string, updates: Partial<LegoPart>) => {
    try {
        const partRef = doc(db, COLLECTION_NAME, partId);
        await updateDoc(partRef, updates);
        return true;
    } catch (error) {
        console.error("Lỗi cập nhật sản phẩm:", error);
        return false;
    }
};

// 4. Hàm xóa sản phẩm
export const deletePart = async (partId: string) => {
    try {
        await deleteDoc(doc(db, COLLECTION_NAME, partId));
        return true;
    } catch (error) {
        console.error("Lỗi xóa sản phẩm:", error);
        return false;
    }
};

// 5. HÀM MỚI: Điều chỉnh tồn kho hàng loạt
export const adjustStock = async (usageMap: Record<string, number>) => {
    try {
        const batch = writeBatch(db);
        let hasUpdates = false;

        for (const [partId, change] of Object.entries(usageMap)) {
            if (change === 0) continue;

            const partRef = doc(db, COLLECTION_NAME, partId);
            const partDoc = await getDoc(partRef);
            if (partDoc.exists()) {
                const data = partDoc.data();
                if (typeof data.stock === 'number') {
                    batch.update(partRef, { stock: increment(change) });
                    hasUpdates = true;
                }
            }
        }

        if (hasUpdates) {
            await batch.commit();
            console.log("Đã cập nhật tồn kho thành công.");
        }
        return true;
    } catch (error) {
        console.error("Lỗi cập nhật tồn kho:", error);
        return false;
    }
};

// 6. HÀM MỚI: Lưu thứ tự sắp xếp sản phẩm
export const saveProductOrder = async (parts: LegoPart[]) => {
    try {
        const batch = writeBatch(db);
        
        // Firestore batch limit is 500. If more than 500 parts, we need multiple batches.
        // For simplicity assuming < 500 for now or simple chunking.
        
        let operationCount = 0;
        
        parts.forEach((part, index) => {
            // Chỉ update nếu order thay đổi để tiết kiệm write
            if (part.order !== index) {
                const partRef = doc(db, COLLECTION_NAME, part.id);
                batch.update(partRef, { order: index });
                operationCount++;
            }
        });

        if (operationCount > 0) {
            await batch.commit();
            console.log(`Đã cập nhật vị trí cho ${operationCount} sản phẩm.`);
        }
        return true;
    } catch (error) {
        console.error("Lỗi lưu thứ tự sản phẩm:", error);
        return false;
    }
};

// 7. HÀM ĐẶC BIỆT: Đẩy dữ liệu mẫu từ constants.tsx lên Firebase
export const seedDatabase = async () => {
    try {
        console.log("Bắt đầu đồng bộ dữ liệu mẫu...");
        const allParts = Object.values(LEGO_PARTS).flat();
        
        let count = 0;
        for (const part of allParts) {
            await setDoc(doc(db, COLLECTION_NAME, part.id), part);
            count++;
        }
        console.log(`Đã đồng bộ thành công ${count} sản phẩm!`);
        return count;
    } catch (error) {
        console.error("Lỗi đồng bộ:", error);
        return 0;
    }
};