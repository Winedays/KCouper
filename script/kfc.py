import argparse

from dotenv import load_dotenv
load_dotenv()  # take environment variables from .env.

from checker.coupon import check_new_coupon
from gatherer.coupon import query_coupon
from gatherer.single import query_single_produce
from notifier.threads import process_pending_queue


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='KCoupon tool')
    parser.add_argument(
        '--mode', '-m', choices=['main', 'check', 'single', 'quick', 'notify'], default='main',
        help='Operation mode: main (default), check, single, quick, notify')
    parser.add_argument(
        '--dry-run', action='store_true',
        help='Dry-run mode for notifications (simulate without posting to API)')
    args = parser.parse_args()

    if args.mode == 'check':
        check_new_coupon()
    elif args.mode == 'single':
        query_single_produce()
    elif args.mode == 'notify':
        process_pending_queue(dry_run=args.dry_run)
    else:
        query_coupon(quick=(args.mode == 'quick'))
