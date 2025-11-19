const requestWakeLock = async () => {
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    console.log('Screen Wake Lock acquired:', wakeLock.released);
    wakeLock.addEventListener('release', () => {
      console.log('Screen Wake Lock released');
    });
  } catch (err) {
    //console.error(err.toString());
  }
};

let wakeLock: WakeLockSentinel | null = null;

export { requestWakeLock };

