pipeline {
  agent any
  stages {
    stage('prepare .env') {
      steps {
        sh "> .env"
        withCredentials([file(credentialsId: 'webwatcher-env', variable: 'SECRET')]) {
          sh "echo `cat ${SECRET}` > .env"
        }
      }
    }

    stage('build') {
      steps {
        sh 'docker build -t webwatcher .'
      }
    }

    stage('deploy') {
      steps {
        sh 'docker-compose up -d'
      }
    }

  }
}
