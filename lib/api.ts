import { functions } from './firebase';
import { httpsCallable } from 'firebase/functions';

export const api = {
  readUserProfile: httpsCallable(functions, 'readUserProfile'),
  queryCandidates: httpsCallable(functions, 'queryCandidates'),
  scoreCandidate: httpsCallable(functions, 'scoreCandidate'),
  createOrQueueMatch: httpsCallable(functions, 'createOrQueueMatch'),
  getActiveMatch: httpsCallable(functions, 'getActiveMatch'),
  closeMatch: httpsCallable(functions, 'closeMatch'),
  storeMessage: httpsCallable(functions, 'storeMessage'),
  moderateText: httpsCallable(functions, 'moderateText'),
  extractSharedInterests: httpsCallable(functions, 'extractSharedInterests'),
  embedText: httpsCallable(functions, 'embedText'),
  storeEmbedding: httpsCallable(functions, 'storeEmbedding'),
  sendPush: httpsCallable(functions, 'sendPush')
};
