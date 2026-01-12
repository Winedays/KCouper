import argparse

from dotenv import load_dotenv
load_dotenv()  # take environment variables from .env.

from checker.coupon import check_new_coupon
from gatherer.coupon import query_coupon
from gatherer.single import query_single_produce


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='KCoupon tool')
    parser.add_argument(
        '--mode', '-m', choices=['main', 'check', 'single', 'quick'], default='main',
        help='Operation mode: main (default) for coupon gathering, check for coupon existence verification, quick for incremental update')
    args = parser.parse_args()

    if args.mode == 'check':
        check_new_coupon()
    elif args.mode == 'single':
        query_single_produce()
    else:
        query_coupon(quick=(args.mode == 'quick'))
