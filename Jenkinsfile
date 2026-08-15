pipeline {

    agent any

    environment {
        DEPLOY_BASE = '/var/www/SSManagement/DEV'
         DEPLOY_PATH = '/var/www/SSManagement/DEV/angular'
        PM2_APP     = 'angular'
        PORT        = '4200'
    }

    stages {

        /*
         * 1. CHECKOUT
         */
        stage('Checkout') {
            steps {

                echo '======================================'
                echo 'CHECKING OUT DEV BRANCH'
                echo '======================================'

                checkout scm
            }
        }


        /*
         * 2. VALIDATE SERVER / BUILD ENVIRONMENT
         */
        stage('Validate Environment') {
            steps {

                sh '''
                    set -e

                    echo "======================================"
                    echo "VALIDATING ENVIRONMENT"
                    echo "======================================"

                    echo "Node version:"
                    node --version

                    echo "NPM version:"
                    npm --version

                    echo "Checking deployment directory..."

                    if [ ! -d "$DEPLOY_BASE" ]; then
                        echo "ERROR: Deployment directory does not exist:"
                        echo "$DEPLOY_BASE"
                        exit 1
                    fi

                    echo "Deployment directory exists."

                    echo "Environment validation successful."
                '''
            }
        }


        /*
         * 3. INSTALL NPM DEPENDENCIES
         */
        stage('Install Dependencies') {
            steps {

                echo '======================================'
                echo 'INSTALLING NPM DEPENDENCIES'
                echo '======================================'

                sh '''
                    set -e

                    npm ci
                '''
            }
        }


        /*
         * 4. BUILD ANGULAR
         */
        stage('Build Angular') {
            steps {

                echo '======================================'
                echo 'BUILDING ANGULAR APPLICATION'
                echo '======================================'

                sh '''
                    set -e

                    rm -rf dist

                    npm run build
                '''
            }
        }


        /*
         * 5. VALIDATE ANGULAR BUILD
         *
         * Actual build structure:
         *
         * dist/
         * └── SSManagement/
         *     └── browser/
         *         └── index.html
         */
        stage('Validate Build') {
            steps {

                sh '''
                    set -e

                    echo "======================================"
                    echo "VALIDATING ANGULAR BUILD"
                    echo "======================================"

                    if [ ! -d "dist" ]; then
                        echo "ERROR: dist directory was not created."
                        exit 1
                    fi

                    BUILD_SOURCE="dist/SSManagement/browser"

                    echo "Expected Angular build:"
                    echo "$BUILD_SOURCE"

                    if [ ! -d "$BUILD_SOURCE" ]; then

                        echo "ERROR: Angular build directory not found:"
                        echo "$BUILD_SOURCE"

                        echo ""
                        echo "Actual dist structure:"
                        find dist -maxdepth 4 -type f | head -100

                        exit 1
                    fi

                    if [ ! -f "$BUILD_SOURCE/index.html" ]; then

                        echo "ERROR: index.html was not found:"
                        echo "$BUILD_SOURCE/index.html"

                        echo ""
                        echo "Files found:"
                        find "$BUILD_SOURCE" -maxdepth 3 -type f

                        exit 1
                    fi

                    FILE_COUNT=$(find "$BUILD_SOURCE" -type f | wc -l)

                    echo "Build file count: $FILE_COUNT"

                    if [ "$FILE_COUNT" -eq 0 ]; then
                        echo "ERROR: Angular build is empty."
                        exit 1
                    fi

                    echo ""
                    echo "Angular build validation successful."
                '''
            }
        }


        /*
         * 6. PREPARE NEW BUILD
         *
         * IMPORTANT:
         *
         * We prepare Angular_new FIRST.
         *
         * We do NOT touch the current live Angular folder yet.
         */
        stage('Prepare New Deployment') {
            steps {

                sh '''
                    set -e

                    echo "======================================"
                    echo "PREPARING NEW DEPLOYMENT"
                    echo "======================================"

                    TEMP_DIR="$DEPLOY_BASE/Angular_new"

                    echo "Temporary directory:"
                    echo "$TEMP_DIR"

                    rm -rf "$TEMP_DIR"

                    mkdir -p "$TEMP_DIR"

                    BUILD_SOURCE="dist/SSManagement/browser"

                    echo "Copying build from:"
                    echo "$BUILD_SOURCE"

                    cp -r "$BUILD_SOURCE"/. "$TEMP_DIR"/

                    echo "Validating temporary deployment..."

                    if [ ! -f "$TEMP_DIR/index.html" ]; then

                        echo "ERROR: index.html is missing from temporary deployment."

                        echo ""
                        echo "Temporary deployment contents:"
                        find "$TEMP_DIR" -maxdepth 3 -type f

                        rm -rf "$TEMP_DIR"

                        exit 1
                    fi

                    FILE_COUNT=$(find "$TEMP_DIR" -type f | wc -l)

                    echo "Temporary deployment file count:"
                    echo "$FILE_COUNT"

                    if [ "$FILE_COUNT" -eq 0 ]; then

                        echo "ERROR: Temporary deployment is empty."

                        rm -rf "$TEMP_DIR"

                        exit 1
                    fi

                    echo ""
                    echo "Temporary deployment prepared successfully."
                '''
            }
        }


        /*
         * 7. BACKUP CURRENT ANGULAR
         *
         * Angular
         *     ↓
         * Angular_YYYYMMDD_HHMMSS
         */
        stage('Backup Current Deployment') {
            steps {

                sh '''
                    set -e

                    echo "======================================"
                    echo "BACKING UP CURRENT DEV BUILD"
                    echo "======================================"

                    if [ -d "$DEPLOY_PATH" ]; then

                        TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

                        BACKUP_PATH="$DEPLOY_BASE/Angular_$TIMESTAMP"

                        echo "Current deployment:"
                        echo "$DEPLOY_PATH"

                        echo "Backup destination:"
                        echo "$BACKUP_PATH"

                        if [ -e "$BACKUP_PATH" ]; then

                            echo "ERROR: Backup directory already exists:"
                            echo "$BACKUP_PATH"

                            exit 1
                        fi

                        mv "$DEPLOY_PATH" "$BACKUP_PATH"

                        echo "$BACKUP_PATH" > "$WORKSPACE/.last_backup"

                        echo "Current Angular build backed up successfully."

                    else

                        echo "No existing Angular deployment found."

                        rm -f "$WORKSPACE/.last_backup"

                    fi
                '''
            }
        }


        /*
         * 8. ACTIVATE NEW BUILD
         *
         * Angular_new
         *     ↓
         * Angular
         */
        stage('Activate New Deployment') {
            steps {

                sh '''
                    set -e

                    echo "======================================"
                    echo "ACTIVATING NEW DEV BUILD"
                    echo "======================================"

                    TEMP_DIR="$DEPLOY_BASE/Angular_new"

                    if [ ! -d "$TEMP_DIR" ]; then

                        echo "ERROR: Temporary deployment does not exist:"
                        echo "$TEMP_DIR"

                        exit 1
                    fi

                    if [ ! -f "$TEMP_DIR/index.html" ]; then

                        echo "ERROR: index.html is missing from temporary deployment."

                        exit 1
                    fi

                    mv "$TEMP_DIR" "$DEPLOY_PATH"

                    echo "New Angular build activated."

                    if [ ! -f "$DEPLOY_PATH/index.html" ]; then

                        echo "ERROR: Active Angular deployment does not contain index.html."

                        exit 1
                    fi

                    echo "Deployment activation successful."
                '''
            }
        }


        /*
         * 9. RESTART PM2
         */
        stage('Restart Angular DEV') {
            steps {

                sh '''
                    set -e

                    echo "======================================"
                    echo "RESTARTING ANGULAR DEV"
                    echo "======================================"

                    pm2 restart "$PM2_APP"

                    pm2 save

                    echo "AngularDEV restart command completed."
                '''
            }
        }


        /*
         * 10. VERIFY DEPLOYMENT
         */
        stage('Verify Deployment') {
            steps {

                sh '''
                    set -e

                    echo "======================================"
                    echo "VERIFYING DEV DEPLOYMENT"
                    echo "======================================"

                    echo ""
                    echo "Checking index.html..."

                    if [ ! -f "$DEPLOY_PATH/index.html" ]; then

                        echo "ERROR: index.html not found:"
                        echo "$DEPLOY_PATH/index.html"

                        exit 1
                    fi

                    echo "index.html found."

                    echo ""
                    echo "Checking PM2..."

                    pm2 status "$PM2_APP"

                    PM2_STATUS=$(pm2 jlist | node -e '
                        let data = "";

                        process.stdin.on("data", d => data += d);

                        process.stdin.on("end", () => {

                            const apps = JSON.parse(data);

                            const app = apps.find(
                                x => x.name === "AngularDEV"
                            );

                            console.log(
                                app ? app.pm2_env.status : "NOT_FOUND"
                            );
                        });
                    ')

                    echo "AngularDEV PM2 status:"
                    echo "$PM2_STATUS"

                    if [ "$PM2_STATUS" != "online" ]; then

                        echo "ERROR: AngularDEV is not online."

                        exit 1
                    fi

                    echo ""
                    echo "Checking port $PORT..."

                    if ! ss -lnt | grep -q ":$PORT "; then

                        echo "ERROR: Port $PORT is not listening."

                        exit 1
                    fi

                    echo "Port $PORT is listening."

                    echo ""
                    echo "Checking deployed files..."

                    ls -lah "$DEPLOY_PATH"

                    echo ""
                    echo "======================================"
                    echo "DEV DEPLOYMENT VERIFIED"
                    echo "======================================"
                '''
            }
        }
    }


    /*
     * POST ACTIONS
     */
    post {

        success {

            echo '''
==========================================
UI DEV DEPLOYMENT SUCCESSFUL
==========================================

Application:
http://200.141.4.172:4200

PM2:
AngularDEV

Port:
4200

Deployment:
New Angular build is live.

Previous build:
Kept as Angular_YYYYMMDD_HHMMSS
==========================================
'''
        }


        failure {

            echo '''
==========================================
UI DEV DEPLOYMENT FAILED
==========================================

Attempting automatic rollback...
==========================================
'''

            sh '''
                set +e

                echo "Starting rollback..."

                if [ -f "$WORKSPACE/.last_backup" ]; then

                    BACKUP_PATH=$(cat "$WORKSPACE/.last_backup")

                    echo "Backup path:"
                    echo "$BACKUP_PATH"

                    if [ -d "$BACKUP_PATH" ]; then

                        echo "Stopping AngularDEV..."

                        pm2 stop "$PM2_APP" || true

                        echo "Removing failed deployment..."

                        rm -rf "$DEPLOY_PATH"

                        echo "Restoring previous deployment..."

                        mv "$BACKUP_PATH" "$DEPLOY_PATH"

                        echo "Restarting AngularDEV..."

                        pm2 restart "$PM2_APP" || true

                        pm2 save || true

                        echo ""
                        echo "======================================"
                        echo "ROLLBACK COMPLETED"
                        echo "======================================"

                    else

                        echo "WARNING: Backup directory does not exist."

                        echo "$BACKUP_PATH"
                    fi

                else

                    echo "WARNING: No backup information available."

                fi
            '''
        }


        always {

            echo 'Cleaning Jenkins workspace...'

            cleanWs(
                deleteDirs: true,
                disableDeferredWipeout: true
            )
        }
    }
}pipeline {

    agent any

    environment {
        DEPLOY_BASE = '/var/www/SSManagement/DEV'
        DEPLOY_PATH = '/var/www/SSManagement/DEV/Angular'
        PM2_APP     = 'AngularDEV'
        PORT        = '4200'
    }

    stages {

        /*
         * 1. CHECKOUT
         */
        stage('Checkout') {
            steps {

                echo '======================================'
                echo 'CHECKING OUT DEV BRANCH'
                echo '======================================'

                checkout scm
            }
        }


        /*
         * 2. VALIDATE SERVER / BUILD ENVIRONMENT
         */
        stage('Validate Environment') {
            steps {

                sh '''
                    set -e

                    echo "======================================"
                    echo "VALIDATING ENVIRONMENT"
                    echo "======================================"

                    echo "Node version:"
                    node --version

                    echo "NPM version:"
                    npm --version

                    echo "Checking deployment directory..."

                    if [ ! -d "$DEPLOY_BASE" ]; then
                        echo "ERROR: Deployment directory does not exist:"
                        echo "$DEPLOY_BASE"
                        exit 1
                    fi

                    echo "Deployment directory exists."

                    echo "Environment validation successful."
                '''
            }
        }


        /*
         * 3. INSTALL NPM DEPENDENCIES
         */
        stage('Install Dependencies') {
            steps {

                echo '======================================'
                echo 'INSTALLING NPM DEPENDENCIES'
                echo '======================================'

                sh '''
                    set -e

                    npm ci
                '''
            }
        }


        /*
         * 4. BUILD ANGULAR
         */
        stage('Build Angular') {
            steps {

                echo '======================================'
                echo 'BUILDING ANGULAR APPLICATION'
                echo '======================================'

                sh '''
                    set -e

                    rm -rf dist

                    npm run build
                '''
            }
        }


        /*
         * 5. VALIDATE ANGULAR BUILD
         *
         * Actual build structure:
         *
         * dist/
         * └── SSManagement/
         *     └── browser/
         *         └── index.html
         */
        stage('Validate Build') {
            steps {

                sh '''
                    set -e

                    echo "======================================"
                    echo "VALIDATING ANGULAR BUILD"
                    echo "======================================"

                    if [ ! -d "dist" ]; then
                        echo "ERROR: dist directory was not created."
                        exit 1
                    fi

                    BUILD_SOURCE="dist/SSManagement/browser"

                    echo "Expected Angular build:"
                    echo "$BUILD_SOURCE"

                    if [ ! -d "$BUILD_SOURCE" ]; then

                        echo "ERROR: Angular build directory not found:"
                        echo "$BUILD_SOURCE"

                        echo ""
                        echo "Actual dist structure:"
                        find dist -maxdepth 4 -type f | head -100

                        exit 1
                    fi

                    if [ ! -f "$BUILD_SOURCE/index.html" ]; then

                        echo "ERROR: index.html was not found:"
                        echo "$BUILD_SOURCE/index.html"

                        echo ""
                        echo "Files found:"
                        find "$BUILD_SOURCE" -maxdepth 3 -type f

                        exit 1
                    fi

                    FILE_COUNT=$(find "$BUILD_SOURCE" -type f | wc -l)

                    echo "Build file count: $FILE_COUNT"

                    if [ "$FILE_COUNT" -eq 0 ]; then
                        echo "ERROR: Angular build is empty."
                        exit 1
                    fi

                    echo ""
                    echo "Angular build validation successful."
                '''
            }
        }


        /*
         * 6. PREPARE NEW BUILD
         *
         * IMPORTANT:
         *
         * We prepare Angular_new FIRST.
         *
         * We do NOT touch the current live Angular folder yet.
         */
        stage('Prepare New Deployment') {
            steps {

                sh '''
                    set -e

                    echo "======================================"
                    echo "PREPARING NEW DEPLOYMENT"
                    echo "======================================"

                    TEMP_DIR="$DEPLOY_BASE/Angular_new"

                    echo "Temporary directory:"
                    echo "$TEMP_DIR"

                    rm -rf "$TEMP_DIR"

                    mkdir -p "$TEMP_DIR"

                    BUILD_SOURCE="dist/SSManagement/browser"

                    echo "Copying build from:"
                    echo "$BUILD_SOURCE"

                    cp -r "$BUILD_SOURCE"/. "$TEMP_DIR"/

                    echo "Validating temporary deployment..."

                    if [ ! -f "$TEMP_DIR/index.html" ]; then

                        echo "ERROR: index.html is missing from temporary deployment."

                        echo ""
                        echo "Temporary deployment contents:"
                        find "$TEMP_DIR" -maxdepth 3 -type f

                        rm -rf "$TEMP_DIR"

                        exit 1
                    fi

                    FILE_COUNT=$(find "$TEMP_DIR" -type f | wc -l)

                    echo "Temporary deployment file count:"
                    echo "$FILE_COUNT"

                    if [ "$FILE_COUNT" -eq 0 ]; then

                        echo "ERROR: Temporary deployment is empty."

                        rm -rf "$TEMP_DIR"

                        exit 1
                    fi

                    echo ""
                    echo "Temporary deployment prepared successfully."
                '''
            }
        }


        /*
         * 7. BACKUP CURRENT ANGULAR
         *
         * Angular
         *     ↓
         * Angular_YYYYMMDD_HHMMSS
         */
        stage('Backup Current Deployment') {
            steps {

                sh '''
                    set -e

                    echo "======================================"
                    echo "BACKING UP CURRENT DEV BUILD"
                    echo "======================================"

                    if [ -d "$DEPLOY_PATH" ]; then

                        TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

                        BACKUP_PATH="$DEPLOY_BASE/Angular_$TIMESTAMP"

                        echo "Current deployment:"
                        echo "$DEPLOY_PATH"

                        echo "Backup destination:"
                        echo "$BACKUP_PATH"

                        if [ -e "$BACKUP_PATH" ]; then

                            echo "ERROR: Backup directory already exists:"
                            echo "$BACKUP_PATH"

                            exit 1
                        fi

                        mv "$DEPLOY_PATH" "$BACKUP_PATH"

                        echo "$BACKUP_PATH" > "$WORKSPACE/.last_backup"

                        echo "Current Angular build backed up successfully."

                    else

                        echo "No existing Angular deployment found."

                        rm -f "$WORKSPACE/.last_backup"

                    fi
                '''
            }
        }


        /*
         * 8. ACTIVATE NEW BUILD
         *
         * Angular_new
         *     ↓
         * Angular
         */
        stage('Activate New Deployment') {
            steps {

                sh '''
                    set -e

                    echo "======================================"
                    echo "ACTIVATING NEW DEV BUILD"
                    echo "======================================"

                    TEMP_DIR="$DEPLOY_BASE/Angular_new"

                    if [ ! -d "$TEMP_DIR" ]; then

                        echo "ERROR: Temporary deployment does not exist:"
                        echo "$TEMP_DIR"

                        exit 1
                    fi

                    if [ ! -f "$TEMP_DIR/index.html" ]; then

                        echo "ERROR: index.html is missing from temporary deployment."

                        exit 1
                    fi

                    mv "$TEMP_DIR" "$DEPLOY_PATH"

                    echo "New Angular build activated."

                    if [ ! -f "$DEPLOY_PATH/index.html" ]; then

                        echo "ERROR: Active Angular deployment does not contain index.html."

                        exit 1
                    fi

                    echo "Deployment activation successful."
                '''
            }
        }


        /*
         * 9. RESTART PM2
         */
        stage('Restart Angular DEV') {
            steps {

                sh '''
                    set -e

                    echo "======================================"
                    echo "RESTARTING ANGULAR DEV"
                    echo "======================================"

                    pm2 restart "$PM2_APP"

                    pm2 save

                    echo "AngularDEV restart command completed."
                '''
            }
        }


        /*
         * 10. VERIFY DEPLOYMENT
         */
        stage('Verify Deployment') {
            steps {

                sh '''
                    set -e

                    echo "======================================"
                    echo "VERIFYING DEV DEPLOYMENT"
                    echo "======================================"

                    echo ""
                    echo "Checking index.html..."

                    if [ ! -f "$DEPLOY_PATH/index.html" ]; then

                        echo "ERROR: index.html not found:"
                        echo "$DEPLOY_PATH/index.html"

                        exit 1
                    fi

                    echo "index.html found."

                    echo ""
                    echo "Checking PM2..."

                    pm2 status "$PM2_APP"

                    PM2_STATUS=$(pm2 jlist | node -e '
                        let data = "";

                        process.stdin.on("data", d => data += d);

                        process.stdin.on("end", () => {

                            const apps = JSON.parse(data);

                            const app = apps.find(
                                x => x.name === "AngularDEV"
                            );

                            console.log(
                                app ? app.pm2_env.status : "NOT_FOUND"
                            );
                        });
                    ')

                    echo "AngularDEV PM2 status:"
                    echo "$PM2_STATUS"

                    if [ "$PM2_STATUS" != "online" ]; then

                        echo "ERROR: AngularDEV is not online."

                        exit 1
                    fi

                    echo ""
                    echo "Checking port $PORT..."

                    if ! ss -lnt | grep -q ":$PORT "; then

                        echo "ERROR: Port $PORT is not listening."

                        exit 1
                    fi

                    echo "Port $PORT is listening."

                    echo ""
                    echo "Checking deployed files..."

                    ls -lah "$DEPLOY_PATH"

                    echo ""
                    echo "======================================"
                    echo "DEV DEPLOYMENT VERIFIED"
                    echo "======================================"
                '''
            }
        }
    }


    /*
     * POST ACTIONS
     */
    post {

        success {

            echo '''
==========================================
UI DEV DEPLOYMENT SUCCESSFUL
==========================================

Application:
http://200.141.4.172:4200

PM2:
AngularDEV

Port:
4200

Deployment:
New Angular build is live.

Previous build:
Kept as Angular_YYYYMMDD_HHMMSS
==========================================
'''
        }


        failure {

            echo '''
==========================================
UI DEV DEPLOYMENT FAILED
==========================================

Attempting automatic rollback...
==========================================
'''

            sh '''
                set +e

                echo "Starting rollback..."

                if [ -f "$WORKSPACE/.last_backup" ]; then

                    BACKUP_PATH=$(cat "$WORKSPACE/.last_backup")

                    echo "Backup path:"
                    echo "$BACKUP_PATH"

                    if [ -d "$BACKUP_PATH" ]; then

                        echo "Stopping AngularDEV..."

                        pm2 stop "$PM2_APP" || true

                        echo "Removing failed deployment..."

                        rm -rf "$DEPLOY_PATH"

                        echo "Restoring previous deployment..."

                        mv "$BACKUP_PATH" "$DEPLOY_PATH"

                        echo "Restarting AngularDEV..."

                        pm2 restart "$PM2_APP" || true

                        pm2 save || true

                        echo ""
                        echo "======================================"
                        echo "ROLLBACK COMPLETED"
                        echo "======================================"

                    else

                        echo "WARNING: Backup directory does not exist."

                        echo "$BACKUP_PATH"
                    fi

                else

                    echo "WARNING: No backup information available."

                fi
            '''
        }


        always {

            echo 'Cleaning Jenkins workspace...'

            cleanWs(
                deleteDirs: true,
                disableDeferredWipeout: true
            )
        }
    }
}
