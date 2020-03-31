# jssanity
Check a code base for require / import statements that point to missing files

# Install
```
npm i -g jssanity
```

# Usage

Run the command in any folder which will parse all .js files in the folder and subfolders and attempt to 
resolve dependencies. Produces a report of all dependencies it could not resolve and the dependencies
that did not resolve to a file that exists.
```
jssanity
```