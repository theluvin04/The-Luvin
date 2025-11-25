// config/firebase.ts
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/storage';
import 'firebase/compat/auth';

// Config của bạn (giữ nguyên)
const firebaseConfig = {
  apiKey: "AIzaSyCEEblAsaEQPDGeEO7PLrzDLfpa7Z8O1ss",
  authDomain: "the-luvin.firebaseapp.com",
  projectId: "the-luvin",
  storageBucket: "the-luvin.appspot.com", // Đã sửa thành tên chuẩn
  messagingSenderId: "280180645664",
  appId: "1:280180645664:web:616b7a84d214629e064145",
  measurementId: "G-1E58PMLPRP"
};

const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(firebaseConfig);

export const db = firebase.firestore(app);
export const storage = firebase.storage(app);
export const auth = firebase.auth(app); // <--- Xuất cái này ra để dùng