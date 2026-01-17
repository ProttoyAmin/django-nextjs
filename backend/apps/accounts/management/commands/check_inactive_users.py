"""
Django management command to check for inactive users
Run this periodically (every 1-2 minutes) via cron or Celery
"""
from django.core.management.base import BaseCommand
from apps.accounts.services.activity_tracker import check_inactive_users


class Command(BaseCommand):
    help = 'Check for inactive online users and mark them as away'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('Checking for inactive users...'))

        marked_away_count = check_inactive_users()

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully marked {marked_away_count} users as away')
        )
