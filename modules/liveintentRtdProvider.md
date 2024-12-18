# Overview

Module Name: LiveIntent Provider
Module Type: Rtd Provider
Maintainer: product@liveintent.com

# Description

This module extracts segments from `bidRequest.userId.lipbid.segments` enriched by the userID module and
inject them in `ortb2.user.data` array entry.

please contact [product@liveintent.com](contact@adagio.io) for more information.

# Testing

To run the example and test the Rtd provider:

```sh
gulp serve --modules=appnexusBidAdapter,rtdModule,liveintentRtdProvider,userId,liveIntentIdSystem
```

Open chrome with this URL:
`http://localhost:9999/integrationExamples/gpt/liveintentRtdProviderExample.html`

To run the unit test:
```sh
gulp test --file "test/spec/modules/liveintentRtdProvider_spec.js"
```

# Integration

```bash
gulp build --modules=userId,liveIntentIdSystem,rtdModule,liveintentRtdProvider
```

```javascript
pbjs.setConfig({
  realTimeData: {
    dataProviders:[{
      name: 'liveintent'
    }]
  }
});
```
