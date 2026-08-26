<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Analytics
    |--------------------------------------------------------------------------
    |
    | Privacy-friendly visit tracking. Enabling stores lightweight events; the
    | disabled default avoids persisting anything when the feature is turned off.
    |
    */

    'enabled' => (bool) env('ANALYTICS_ENABLED', false),
    'site_token' => env('ANALYTICS_SITE_TOKEN'),
    'domain' => env('ANALYTICS_DOMAIN'),

];