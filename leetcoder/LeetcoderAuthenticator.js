import {gql} from "../utils/utils.js";
import Logger from "../utils/Logger.js";
import {getBrowserDetails} from "../managers/BrowserManager.js";

class LeetcoderAuthenticator {
  // Fails fast instead of waiting for a manual login inside the automated browser, which Google OAuth rejects anyway.
  static loginUser = async () => {
    Logger.error('<<<< Starting Leetcoder Authenticator >>>>');
    const {page} = await getBrowserDetails();
    const {userStatus} = await gql(page, "{userStatus{isSignedIn username}}");
    if (!userStatus?.isSignedIn) {
      throw new Error("Not logged in to LeetCode. Run mode L, log in, fully quit that Chrome (Cmd+Q on macOS), then try again.");
    }
    Logger.success(`Logged in as ${userStatus.username}`);
    Logger.error('<<<< Exiting Leetcoder Authenticator >>>>');
  };
}

export default LeetcoderAuthenticator;
