import { ɵivyEnabled, inject, Injectable } from '@angular/core';

import { ActionType } from '../actions/symbols';
import { getActionTypeFromInstance } from '../utils/utils';
import { InitState, UpdateState } from '../actions/actions';

@Injectable({ providedIn: 'root' })
export class UnhandledActionsLogger {
  /**
   * These actions should be ignored by default; we can increase this
   * list in the future via the `ignoreActions` method.
   */
  private _ignoredActions = new Set<string>([InitState.type, UpdateState.type]);

  /**
   * Adds actions to the internal list of actions that should be ignored.
   */
  ignoreActions(...actions: ActionType[]): void {
    for (const action of actions) {
      this._ignoredActions.add(action.type);
    }
  }

  /** @internal */
  warnIfNeeded(action: any): void {
    const actionShouldBeIgnored = Array.from(this._ignoredActions).some(
      type => type === getActionTypeFromInstance(action)
    );

    if (actionShouldBeIgnored) {
      return;
    }

    action =
      action.constructor && action.constructor.name !== 'Object'
        ? action.constructor.name
        : action.type;

    console.warn(
      `The ${action} action has been dispatched but hasn't been handled. This may happen if the state with an action handler for this action is not registered.`
    );
  }
}

/**
 * A helper function may be invoked within constructors to add actions that
 * should be ignored. This eliminates injecting the `UnhandledActionsLogger`
 * directly. Moreover, developers should guard this function with the `ngDevMode`
 * variable that will allow tree-shake `UnhandledActionsLogger` and this function
 * itself from the production bundle:
 * ```ts
 * import { RouterNavigation, RouterCancel } from '@ngxs/router-plugin';
 *
 * declare const ngDevMode: boolean;
 *
 * @Component()
 * export class AppComponent {
 *   constructor() {
 *     ngDevMode && ignoreActions(RouterNavigation, RouterCancel);
 *   }
 * }
 * ```
 */
export function ignoreActions(...actions: ActionType[]): void {
  if (ɵivyEnabled) {
    const unhandledActionsLogger = inject(UnhandledActionsLogger);
    unhandledActionsLogger.ignoreActions(...actions);
  }
}
