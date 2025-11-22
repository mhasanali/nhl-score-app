import { Firestore } from "firebase-admin/firestore";
import * as admin from 'firebase-admin';

export const initializeFirebase = (): Firestore => {
  if (admin.apps.length === 0) {
    const serviceAccount = require('../../../serviceAccount.json');
    
    console.log("Initializing Firebase")
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    
    console.log('Firebase initialized');
  }
  
  return admin.firestore();
};

export const getFirestore = (): Firestore => {
  return admin.firestore();
};
