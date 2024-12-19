/**
 * This module adds the liveintent provider to the Real Time Data module (rtdModule).
 */
import { submodule } from '../src/hook.js';

const SUBMODULE_NAME = 'liveintent';
const GVLID = 148;

/**
 * Init
 * @param {Object} config Module configuration
 * @param {UserConsentData} userConsent User consent
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
  bidRequest.bids.forEach(bid => {
    const userIdSegments = { segment: bid?.userId?.lipbid?.segments?.map(id => ({ id })) }
    if (userIdSegments.length > 0) {
      const liSegments = [{name: 'liveintent.com', ...userIdSegments}]
      if (bid?.ortb2?.user?.data) {
        bid.ortb2.user.data = bid.ortb2.user.data.concat(liSegments)
      } else {
        bid.ortb2 = {...bid.ortb2, ...{user: {data: liSegments}}}
      }
    }
  })
}

export const liveintentRtdSubmodule = {
  name: SUBMODULE_NAME,
  gvlid: GVLID,
  init: init,
  onBidRequestEvent: onBidRequest,
};

submodule('realTimeData', liveintentRtdSubmodule);
