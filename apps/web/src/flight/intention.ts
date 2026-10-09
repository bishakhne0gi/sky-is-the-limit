// The intention text lives only here, in memory, for the current session.
// It is never written to storage, the store, or the network.
let words = '';
export const setIntention = (w: string) => { words = w.slice(0, 80); };
export const getIntention = () => words;
