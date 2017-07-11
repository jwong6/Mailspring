import pathwatcher from 'pathwatcher';
import ReactTestUtils from 'react-dom/test-utils';
import {TaskQueue} from 'nylas-exports'

class MasterAfterEach {
  setup(loadSettings, afterEach) {
    const styleElementsToRestore = NylasEnv.styles.getSnapshot();

    const self = this
    afterEach(async function masterAfterEach() {
      // await destroyTestDatabase() TODO BEN
      NylasEnv.packages.deactivatePackages();
      NylasEnv.menu.template = [];

      if (!window.debugContent) {
        document.getElementById('jasmine-content').innerHTML = '';
      }
      ReactTestUtils.unmountAll();

      jasmine.unspy(NylasEnv, 'saveSync');
      self.ensureNoPathSubscriptions();

      NylasEnv.styles.restoreSnapshot(styleElementsToRestore);

      this.removeAllSpies();
      if (TaskQueue._queue.length > 0) {
        console.inspect(TaskQueue._queue)
        TaskQueue._queue = []
        throw new Error("Your test forgot to clean up the TaskQueue")
      }
      waits(0);
    }); // yield to ui thread to make screen update more frequently
  }

  ensureNoPathSubscriptions() {
    const watchedPaths = pathwatcher.getWatchedPaths();
    pathwatcher.closeAllWatchers();
    if (watchedPaths.length > 0) {
      throw new Error(`Leaking subscriptions for paths: ${watchedPaths.join(", ")}`);
    }
  }
}

export default new MasterAfterEach()
