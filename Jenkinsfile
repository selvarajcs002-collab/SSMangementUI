pipeline {

    agent any

    environment {
        DEPLOY_BASE = '/var/www/SSManagement/DEV'
        DEPLOY_PATH = '/var/www/SSManagement/DEV/angular'
        PM2_APP     = 'AngularDEV'
        PORT        = '4200'
    }

    stages {

        stage('Checkout') {
            steps {

                echo '======================================'
                echo 'CHECKING OUT DEV BRANCH'
                echo '======================================'

                checkout scm
            }
        }


        stage('Validate Environment') {
            steps {

                sh '''
                    set -e

                    echo "======================================"
                    echo "VALIDATING ENVIRONMENT"
                    echo "======================================"

                    echo "Node:"
                    node --version

                    echo "NPM:"
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


        stage('Validate Build') {
            steps {

                sh '''
                    set -e

                    echo "======================================"
                    echo "VALIDATING ANGULAR BUILD"
                    echo "======================================"

                    BUILD_SOURCE="dist/SSManagement/browser"

                    if [ ! -d "$BUILD_SOURCE" ]; then

                        echo "ERROR: Angular build directory not found:"
                        echo "$BUILD_SOURCE"

                        echo ""
                        echo "Actual dist structure:"
                        find dist -maxdepth 4 -type f | head -100

                        exit 1
                    fi

                    if [ ! -f "$BUILD_SOURCE/index.html" ]; then

                        echo "ERROR: index.html not found."

                        find "$BUILD_SOURCE" -maxdepth 3 -type f

                        exit 1
                    fi

                    FILE_COUNT=$(find "$BUILD_SOURCE" -type f | wc -l)

                    echo "Build file count: $FILE_COUNT"

                    if [ "$FILE_COUNT" -eq 0 ]; then
                        echo "ERROR: Angular build is empty."
                        exit 1
                    fi

                    echo "Angular build validation successful."
                '''
            }
        }


        stage('Prepare New Deployment') {
            steps {

                sh '''
                    set -e

                    echo "======================================"
                    echo "PREPARING NEW DEPLOYMENT"
                    echo "======================================"

                    TEMP_DIR="$DEPLOY_BASE/Angular_new"

                    rm -rf "$TEMP_DIR"

                    mkdir -p "$TEMP_DIR"

                    BUILD_SOURCE="dist/SSManagement/browser"

                    cp -r "$BUILD_SOURCE"/. "$TEMP_DIR"/

                    if [ ! -f "$TEMP_DIR/index.html" ]; then

                        echo "ERROR: index.html missing."

                        rm -rf "$TEMP_DIR"

                        exit 1
                    fi

                    FILE_COUNT=$(find "$TEMP_DIR" -type f | wc -l)

                    echo "Temporary build files: $FILE_COUNT"

                    if [ "$FILE_COUNT" -eq 0 ]; then

                        echo "ERROR: Temporary deployment is empty."

                        rm -rf "$TEMP_DIR"

                        exit 1
                    fi

                    echo "Temporary deployment prepared successfully."
                '''
            }
        }


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

                        echo "Backup:"
                        echo "$BACKUP_PATH"

                        if [ -e "$BACKUP_PATH" ]; then

                            echo "ERROR: Backup already exists."

                            exit 1
                        fi

                        mv "$DEPLOY_PATH" "$BACKUP_PATH"

                        echo "$BACKUP_PATH" > "$DEPLOY_BASE/.last_backup"

                        echo "Backup completed."

                    else

                        echo "No existing Angular deployment."

                        rm -f "$DEPLOY_BASE/.last_backup"

                    fi
                '''
            }
        }


        stage('Activate New Deployment') {
            steps {

                sh '''
                    set -e

                    echo "======================================"
                    echo "ACTIVATING NEW DEV BUILD"
                    echo "======================================"

                    TEMP_DIR="$DEPLOY_BASE/Angular_new"

                    if [ ! -d "$TEMP_DIR" ]; then

                        echo "ERROR: Temporary deployment does not exist."

                        exit 1
                    fi

                    if [ ! -f "$TEMP_DIR/index.html" ]; then

                        echo "ERROR: index.html missing."

                        exit 1
                    fi

                    mv "$TEMP_DIR" "$DEPLOY_PATH"

                    echo "New Angular build activated."

                    if [ ! -f "$DEPLOY_PATH/index.html" ]; then

                        echo "ERROR: Active deployment is invalid."

                        exit 1
                    fi

                    echo "Deployment activation successful."
                '''
            }
        }


        stage('Restart Angular DEV') {
            steps {

                sh '''
                    set -e

                    echo "======================================"
                    echo "RESTARTING ANGULAR DEV"
                    echo "======================================"

                    pm2 restart "$PM2_APP"

                    pm2 save

                    echo "AngularDEV restarted."
                '''
            }
        }


        stage('Verify Deployment') {
            steps {

                sh '''
                    set -e

                    echo "======================================"
                    echo "VERIFYING DEV DEPLOYMENT"
                    echo "======================================"

                    if [ ! -f "$DEPLOY_PATH/index.html" ]; then

                        echo "ERROR: index.html not found."

                        exit 1
                    fi

                    echo "index.html exists."

                    echo ""
                    echo "PM2 status:"

                    pm2 status "$PM2_APP"

                    echo ""
                    echo "Checking port $PORT..."

                    if ! ss -lnt | grep -q ":$PORT "; then

                        echo "ERROR: Port $PORT is not listening."

                        exit 1
                    fi

                    echo "Port $PORT is listening."

                    echo ""
                    echo "Deployment verification successful."
                '''
            }
        }
    }


    post {

        success {

            echo '''
==========================================
UI DEV DEPLOYMENT SUCCESSFUL
==========================================

URL:
http://200.141.4.172:4200

PM2:
AngularDEV

Port:
4200

Previous builds are stored as:

Angular_YYYYMMDD_HHMMSS
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

                BACKUP_FILE="$DEPLOY_BASE/.last_backup"

                if [ -f "$BACKUP_FILE" ]; then

                    BACKUP_PATH=$(cat "$BACKUP_FILE")

                    echo "Backup:"
                    echo "$BACKUP_PATH"

                    if [ -d "$BACKUP_PATH" ]; then

                        echo "Stopping AngularDEV..."

                        pm2 stop "$PM2_APP" || true

                        echo "Removing failed deployment..."

                        rm -rf "$DEPLOY_PATH"

                        echo "Restoring previous build..."

                        mv "$BACKUP_PATH" "$DEPLOY_PATH"

                        echo "Restarting AngularDEV..."

                        pm2 restart "$PM2_APP" || true

                        pm2 save || true

                        echo "Rollback completed."

                    else

                        echo "Backup directory not found."

                    fi

                else

                    echo "No backup information available."

                fi
            '''
        }
    }
}
