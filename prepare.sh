# Nodemon needs to be installed either as dev dependency or globally
# npm i -d nodemon
# if installed as -g just use "nodemon -w ./ --exec yarn prepare -e tsx"

# this script checks for nodemon, if not it is included as dev dependency anyway :D

if ! command -v nodemon &> /dev/null
then
    echo "nodemon could not be found";
    [ ! -d "node_modules" ] && yarn install;
    [ -d "node_modules" ] && node ./node_modules/nodemon/bin/nodemon.js -w ./ --exec yarn prepare -e tsx
else 
    [ ! -d "node_modules" ] && yarn install;
    [ -d "node_modules" ] && node nodemon -w ./ --exec yarn prepare -e tsx
fi
