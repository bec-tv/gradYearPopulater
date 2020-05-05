grad-year-populater
==============

Script to populate the Grad Year (custom field) in Cablecast Shows

Copyright 2020 - Brandon McKenzie / BEC-TV

Installation
------------

1. Clone or download the code from github.
2. Install Node.js
3. Run npm install
4. Create a `.env` file with your settings.  Save the file in the same directory as the `populater.js` file.  The following settings are defined:
* URL - The address of the Cablecast server to access.  Starts with either `http://` or `https://`.  Do not include a trailing `/` at the end!
* CREDENTIALS - The username:password to use to access Cablecast.  The provided user must have access to the `Schedule & Shows` permission.
* See example later in this document for reference.
5. run `node populater.js` to execute the script.

Example .env file:
------------------
````javascript
CREDENTIALS=bob:12345
URL=https://cablecast.example.com
````

Notes
-----

This script was designed and tested with Cablecast 6.6.1.  It is possible that older/newer versions of Cablecast will require edits.