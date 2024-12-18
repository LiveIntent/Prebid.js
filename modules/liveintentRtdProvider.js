/**
 * This module adds the liveintent provider to the Real Time Data module (rtdModule).
 * The {@link module:modules/realTimeData} module is required.
 * @module modules/liveintentRtdProvider
 * @requires module:modules/realTimeData
 */
import { submodule } from '../src/hook.js';
import { deepAccess} from '../src/utils.js';
import { extractUserSegments } from '../libraries/dspxUtils/bidderUtils.js';

/**
 * @typedef {import('../modules/rtdModule/index.js').RtdSubmodule} RtdSubmodule
 * @typedef {import('../modules/rtdModule/index.js').adUnit} adUnit
 */
const SUBMODULE_NAME = 'liveintent';
const GVLID = 148;

/**
 * Init
 * @param {Object} config Module configuration
 * @param {boolean} userConsent User consent
 * @returns true
 */
const init = (config, userConsent) => {
  return true;
}

/**
 * onBidRequest is called for each bidder during an auction and contains the bids for that bidder.
 *
 * @param {Object} bidRequest
 * @param {SubmoduleConfig} config
 * @param {UserConsentData} userConsent
 */

function onBidRequest(bidRequest, config, userConsent) {
  const userIdSegments = bidRequest.userId.lipbid.segments
  const bidderRequestSegments = extractUserSegments(bidRequest).segment
  const segments = [...userIdSegments, ...bidderRequestSegments]
  bidRequest.ortb2.user.data = segments
}

export const liveintentRtdSubmodule = {
  name: SUBMODULE_NAME,
  gvlid: GVLID,
  init: init,
  onBidRequestEvent: onBidRequest,
};

submodule('realTimeData', liveintentRtdSubmodule);
