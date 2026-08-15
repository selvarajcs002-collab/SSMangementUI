pipeline {

    agent any

    environment {
        DEPLOY_BASE = '/var/www/SSManagement/DEV'
        DEPLOY_PATH = '/var/www/SSManagement/DEV/Angular'
        PM2_APP     = 'AngularDEV'
        PORT        = '4200'
    }

    stages {

        stage('Checkout') {
            steps {
                echo 'Checking out UI DEV branch...'

                checkout scm
            }
        }

        stage('Validate Environment') {
            steps {
                sh '''
                    set -e

                    echo "======================================"
                    echo "VALIDATING BUILD ENVIRONMENT"
                    echo "======================================"

                    echo "Node version:"
                    node --version

                    echo "NPM version:"
                    npm --version

                    echo "PM2 version:"
                    pm2 --version

                    echo "Checking deployment directory..."

                    if [ ! -d "$DEPLOY_BASE" ]; then
                        echo "ERROR: Deployment base directory does not exist:"
                        echo "$DEPLOY_BASE"
                        exit 1
                    fi

                    echo "Environment validation successful."
                '''
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Installing Angular dependencies...'

                sh '''
                    set -e

                    npm ci
                '''
            }
        }

        stage('Build Angular') {
            steps {
                echo 'Building Angular application...'

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

                    if [ ! -d "dist" ]; then
                        echo "ERROR: dist directory was not created."
                        exit 1
                    fi

                    if [ -d "dist/browser" ]; then
                        BUILD_SOURCE="dist/browser"
                    else
                        BUILD_SOURCE="dist"
                    fi

                    echo "Build source: $BUILD_SOURCE"

                    if [ ! -f "$BUILD_SOURCE/index.html" ]; then
                        echo "ERROR: index.html was not found."
                        echo "Angular build is invalid."
                        exit 1
                    fi

                    echo "index.html found."

                    FILE_COUNT=$(find "$BUILD_SOURCE" -type f | wc -l)

                    echo "Build file count: $FILE_COUNT"

                    if [ "$FILE_COUNT" -eq 0 ]; then
                        echo "ERROR: Build contains no files."
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

                    if [ -d "dist/browser" ]; then
                        cp -r dist/browser/* "$TEMP_DIR"/
                    else
                        cp -r dist/* "$TEMP_DIR"/
                    fi

                    if [ ! -f "$TEMP_DIR/index.html" ]; then
                        echo "ERROR: index.html missing from temporary deployment."
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
                    echo "BACKING UP CURRENT DEPLOYMENT"
                    echo "======================================"

                    if [ -d "$DEPLOY_PATH" ]; then

                        TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
                        BACKUP_PATH="$DEPLOY_BASE/Angular_$TIMESTAMP"

                        echo "Current deployment:"
                        echo "$DEPLOY_PATH"

                        echo "Backup:"
                        echo "$BACKUP_PATH"

                        mv "$DEPLOY_PATH" "$BACKUP_PATH"

                        echo "$BACKUP_PATH" > "$WORKSPACE/.last_backup"

                        echo "Current deployment backed up successfully."

                    else

                        echo "No existing Angular deployment found."

                        rm -f "$WORKSPACE/.last_backup"

                    fi
                '''
            }
        }

        stage('Activate New Deployment') {
            steps {
                sh '''
                    set -e

                    echo "======================================"
                    echo "ACTIVATING NEW DEPLOYMENT"
                    echo "======================================"

                    if [ ! -d "$DEPLOY_BASE/Angular_new" ]; then
                        echo "ERROR: Temporary deployment does not exist."
                        exit 1
                    fi

                    mv "$DEPLOY_BASE/Angular_new" "$DEPLOY_PATH"

                    echo "New Angular deployment is now active."

                    test -f "$DEPLOY_PATH/index.html"

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

                    echo "AngularDEV restarted successfully."
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

                    echo "Checking PM2 process..."

                    pm2 describe "$PM2_APP"

                    PM2_STATUS=$(pm2 jlist | node -e '
                        let data="";
                        process.stdin.on("data",d=>data+=d);
                        process.stdin.on("end",()=>{
                            const apps=JSON.parse(data);
                            const app=apps.find(x=>x.name==="AngularDEV");
                            console.log(app ? app.pm2_env.status : "NOT_FOUND");
                        });
                    ')

                    echo "AngularDEV status: $PM2_STATUS"

                    if [ "$PM2_STATUS" != "online" ]; then
                        echo "ERROR: AngularDEV is not online."
                        exit 1
                    fi

                    echo "Checking port $PORT..."

                    if ! ss -lnt | grep -q ":$PORT "; then
                        echo "ERROR: Port $PORT is not listening."
                        exit 1
                    fi

                    echo "Port $PORT is listening."

                    echo "======================================"
                    echo "DEV DEPLOYMENT VERIFIED SUCCESSFULLY"
                    echo "======================================"
                '''
            }
        }
    }

    post {

        success {
            echo '======================================'
            echo 'UI DEV DEPLOYMENT SUCCESSFUL'
            echo '======================================'
        }

        failure {
            echo '======================================'
            echo 'UI DEV DEPLOYMENT FAILED'
            echo '======================================'

            sh '''
                echo "Deployment failed."

                if [ -f "$WORKSPACE/.last_backup" ]; then

                    BACKUP_PATH=$(cat "$WORKSPACE/.last_backup")

                    echo "Backup found:"
                    echo "$BACKUP_PATH"

                    if [ -d "$BACKUP_PATH" ]; then

                        echo "Starting automatic rollback..."

                        pm2 stop "$PM2_APP" || true

                        rm -rf "$DEPLOY_PATH"

                        mv "$BACKUP_PATH" "$DEPLOY_PATH"

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

        always {
            echo 'Cleaning Jenkins workspace...'

            cleanWs()
        }
    }
}
