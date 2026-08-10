pipeline {

    agent any

    environment {
        TEST_PATH = '/var/www/SSManagement/TEST/Angular'
        PM2_APP = 'AngularTEST'
    }

    stages {

        stage('Checkout TEST') {
            steps {
                echo 'Checking out TEST branch...'
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Installing Angular dependencies...'
                sh 'npm ci'
            }
        }

        stage('Build Angular TEST') {
            steps {
                echo 'Building Angular TEST...'
                sh 'npm run build'
            }
        }

        stage('Deploy TEST UI') {
            steps {
                echo 'Deploying Angular TEST...'

                sh '''
                    set -e

                    echo "Target: ${TEST_PATH}"

                    mkdir -p "${TEST_PATH}"

                    echo "Removing old TEST build..."
                    rm -rf "${TEST_PATH}"/*

                    echo "Copying new Angular build..."

                    if [ -d "dist/browser" ]; then
                        cp -r dist/browser/* "${TEST_PATH}/"
                    else
                        cp -r dist/* "${TEST_PATH}/"
                    fi

                    echo "Deployment files copied successfully."
                '''
            }
        }

        stage('Restart Angular TEST') {
            steps {
                echo 'Restarting AngularTEST...'

                sh '''
                    pm2 restart "${PM2_APP}"
                    pm2 save
                '''
            }
        }

        stage('Verify Deployment') {
            steps {
                sh '''
                    set -e

                    echo "Checking deployed files..."

                    test -f "${TEST_PATH}/index.html"

                    echo "Checking AngularTEST..."

                    pm2 status "${PM2_APP}"

                    echo "Checking port 4201..."

                    ss -tulpn | grep 4201

                    echo "TEST UI deployment successful."
                '''
            }
        }
    }

    post {

        success {
            echo '======================================'
            echo ' TEST UI DEPLOYMENT SUCCESSFUL'
            echo '======================================'
            echo 'URL: http://200.141.4.172:4201'
        }

        failure {
            echo '======================================'
            echo ' TEST UI DEPLOYMENT FAILED'
            echo '======================================'
        }
    }
}
