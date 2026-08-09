pipeline {

    agent any

    environment {
        DEPLOY_PATH = '/var/www/SSManagement/DEV/angular'
    }

    stages {

        stage('Checkout') {
            steps {
                echo 'Checking out UI DEV branch...'
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Installing Angular dependencies...'

                sh '''
                    npm ci
                '''
            }
        }

        stage('Build Angular') {
            steps {
                echo 'Building Angular application...'

                sh '''
                    rm -rf dist
                    npm run build
                '''
            }
        }

        stage('Deploy Angular') {
    steps {
        echo 'Deploying Angular application...'

        sh '''
            rsync -av --delete \
                dist/SSManagement/browser/ \
                /var/www/SSManagement/DEV/angular/
        '''
    }
}
    }

    post {

        success {
            echo 'UI DEV deployment completed successfully.'
        }

        failure {
            echo 'UI DEV deployment failed.'
        }
    }
}
