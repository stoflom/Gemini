# Gemini
Project uses new yarn which does not use node_modules subdirectory.
See yarn website.

Firts run source ./setkey.sh to setup the Gemini API key in an environment variable.

To run src/main.ts:
>yarn start

To run script src/testSqlite.ts
>yarn testSqlite

etc. 

NOTE: above are according to config in package.json

Can also do:
yarn            #Install all dependencies
yarn info       # Shows things
yarn rebuild    #Rebuilds all
yarn up         #upgrades all packages
yarn config     #shows configuration

To configure vscode:
>yarn dlx @yarnpkg/sdks vscode
    will generate: .vscode/settings.json

NOTE (from yarn website): 
For safety reason VSCode requires you to explicitly activate the custom TS settings:
i) Press ctrl+shift+p in a TypeScript file
ii) Choose "Select TypeScript Version"
iii) Pick "Use Workspace Version"
Your VSCode project is now configured to use the exact same version of TypeScript as the one you usually use, except that it will be able to properly resolve the type definitions.
