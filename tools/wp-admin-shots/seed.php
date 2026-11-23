<?php
/**
 * Plugin Name: wp-admin-shots seed (docs tooling)
 *
 * Loaded two ways:
 *  1. As a mu-plugin (mapped by .wp-env.json) on every request: keeps WordPress from
 *     contacting the WCPOS licence/update servers, so the fake docs licence below is
 *     never checked or flipped.
 *  2. With `wp eval-file` once WordPress has loaded: seeds the site. Idempotent:
 *     everything is found by name, login, SKU or meta before it is created.
 *     `wp eval-file seed.php licence` writes only the licence: Pro decides at load
 *     whether its Stores features boot, so the licence must be in place one process
 *     before the stores are seeded.
 *
 * All names, addresses and emails are fictional (emails @example.com).
 *
 * @package wp-admin-shots
 */

if ( ! defined( 'WPAS_SEED_FILTERS' ) ) {
	define( 'WPAS_SEED_FILTERS', true );
	add_filter(
		'pre_http_request',
		static function ( $pre, $args, $url ) {
			$host = (string) wp_parse_url( $url, PHP_URL_HOST );
			if ( 'wcpos.com' === $host || str_ends_with( $host, '.wcpos.com' ) ) {
				return new WP_Error( 'wpas_offline', 'wp-admin-shots: the WCPOS servers are not contacted from the docs env.' );
			}
			return $pre;
		},
		1,
		3
	);
	// WCPOS registers its REST routes only for a request it recognises as its own (wcpos_request()
	// reads the X-WCPOS header), and WP-CLI runs rest_api_init before eval-file's code, so a seed
	// process is marked here, at mu-plugin load.
	if ( defined( 'WP_CLI' ) && WP_CLI && in_array( 'eval-file', $GLOBALS['argv'] ?? array(), true ) ) {
		$_SERVER['HTTP_X_WCPOS'] = '1';
	}
}

// Mu-plugin load (or a web request): stop here. The seed runs only under `wp eval-file`.
if ( ! ( defined( 'WP_CLI' ) && WP_CLI && did_action( 'init' ) ) ) {
	return;
}

$wpas_created = array();
$wpas_note    = static function ( string $what ) use ( &$wpas_created ) {
	$wpas_created[] = $what;
	WP_CLI::log( 'created: ' . $what );
};

// An obviously fake key; activated so Pro's Stores features boot.
$wpas_license_option = 'woocommerce_pos_pro_settings_license';
$wpas_license        = get_option( $wpas_license_option, array() );
$wpas_license        = is_array( $wpas_license ) ? $wpas_license : array();
if ( 'WCPOS-DOCS-0000-0000' !== ( $wpas_license['key'] ?? '' ) || true !== ( $wpas_license['activated'] ?? false ) ) {
	update_option( $wpas_license_option, array_merge( $wpas_license, array( 'key' => 'WCPOS-DOCS-0000-0000', 'activated' => true ) ) );
	$wpas_note( 'licence' );
}
if ( in_array( 'licence', $args ?? array(), true ) ) {
	WP_CLI::log( 'seed: licence ' . ( $wpas_created ? 'written' : 'unchanged' ) );
	return;
}
if ( ! function_exists( 'woocommerce_pos_pro_activated' ) || ! woocommerce_pos_pro_activated() || ! post_type_exists( 'wcpos_store' ) ) {
	WP_CLI::error( 'WCPOS Pro is not active with its licence; run the licence step first.' );
}

// Site and WooCommerce settings (plain option writes; not counted as created).
$wpas_options = array(
	'blogdescription'                           => 'Homeware and coffee',
	'admin_email'                               => 'alex@example.com',
	'timezone_string'                           => 'America/Los_Angeles', // the stores' own zone, as shoot's browser
	'woocommerce_store_address'                 => '12 Harbour Street',
	'woocommerce_store_address_2'               => '',
	'woocommerce_store_city'                    => 'Portland',
	'woocommerce_default_country'               => 'US:OR',
	'woocommerce_store_postcode'                => '97204',
	'woocommerce_currency'                      => 'USD',
	'woocommerce_calc_taxes'                    => 'yes',
	'woocommerce_onboarding_profile'            => array( 'skipped' => true ),
	'woocommerce_task_list_hidden'              => 'yes',
	'woocommerce_task_list_complete'            => 'yes',
	'woocommerce_extended_task_list_hidden'     => 'yes',
	'woocommerce_show_marketplace_suggestions'  => 'no',
	'woocommerce_allow_tracking'                => 'no',
	'woocommerce_coming_soon'                   => 'no',
);
foreach ( $wpas_options as $wpas_key => $wpas_value ) {
	update_option( $wpas_key, $wpas_value );
}

// No ampersand: WordPress stores blogname HTML-escaped and the desktop app prints it raw ("&amp;").
if ( 'Harbour and Vine' !== get_option( 'blogname' ) ) {
	update_option( 'blogname', 'Harbour and Vine' );
	$wpas_note( 'site name Harbour and Vine' );
}

// The env is plain http://localhost: with force_ssl on, /pos redirects to an https URL nothing serves.
$wpas_general = get_option( 'woocommerce_pos_settings_general', array() );
$wpas_general = is_array( $wpas_general ) ? $wpas_general : array();
if ( false !== ( $wpas_general['force_ssl'] ?? null ) ) {
	update_option( 'woocommerce_pos_settings_general', array_merge( $wpas_general, array( 'force_ssl' => false ) ) );
	$wpas_note( 'force_ssl off' );
}

global $wpdb;
$wpas_rate = $wpdb->get_var( "SELECT tax_rate_id FROM {$wpdb->prefix}woocommerce_tax_rates WHERE tax_rate_country = 'US' AND tax_rate_state = 'WA' AND tax_rate_class = ''" );
if ( ! $wpas_rate ) {
	WC_Tax::_insert_tax_rate(
		array(
			'tax_rate_country'  => 'US',
			'tax_rate_state'    => 'WA',
			'tax_rate'          => '10.2500',
			'tax_rate_name'     => 'Sales tax',
			'tax_rate_priority' => 1,
			'tax_rate_compound' => 0,
			'tax_rate_shipping' => 1,
			'tax_rate_order'    => 0,
			'tax_rate_class'    => '',
		)
	);
	$wpas_note( 'tax rate US/WA 10.25%' );
}

// Admin: no email-change notification (there is no mail server in wp-env anyway).
add_filter( 'send_email_change_email', '__return_false' );
$wpas_admin = get_user_by( 'id', 1 );
if ( $wpas_admin && 'Alex Morgan' !== $wpas_admin->display_name ) {
	wp_update_user( array( 'ID' => 1, 'first_name' => 'Alex', 'last_name' => 'Morgan', 'display_name' => 'Alex Morgan', 'nickname' => 'Alex Morgan', 'user_email' => 'alex@example.com' ) );
	$wpas_note( 'admin profile' );
}

// Maya Chen signs in to the desktop app for the Choose a store shot. Like wp-env's own
// admin/password, this is a throwaway for a local container only, not a secret.
$wpas_maya_pass = 'password';
$wpas_users     = array();
foreach ( array( array( 'Maya', 'Chen', 'cashier' ), array( 'Leo', 'Park', 'cashier' ), array( 'Priya', 'Nair', 'cashier' ), array( 'Sam', 'Ortiz', 'shop_manager' ) ) as list( $wpas_first, $wpas_last, $wpas_role ) ) {
	$wpas_login = strtolower( $wpas_first );
	$wpas_user  = get_user_by( 'login', $wpas_login );
	if ( ! $wpas_user ) {
		$wpas_id = wp_insert_user(
			array(
				'user_login'   => $wpas_login,
				'user_email'   => $wpas_login . '@example.com',
				'user_pass'    => 'maya' === $wpas_login ? $wpas_maya_pass : wp_generate_password( 24 ),
				'first_name'   => $wpas_first,
				'last_name'    => $wpas_last,
				'display_name' => "$wpas_first $wpas_last",
				'role'         => $wpas_role,
			)
		);
		if ( is_wp_error( $wpas_id ) ) {
			WP_CLI::error( "user $wpas_login: " . $wpas_id->get_error_message() );
		}
		$wpas_note( "user $wpas_first $wpas_last" . ( 'maya' === $wpas_login ? ' (local password)' : '' ) );
		$wpas_user = get_user_by( 'id', $wpas_id );
	}
	if ( 'maya' === $wpas_login && ! wp_check_password( $wpas_maya_pass, $wpas_user->user_pass, $wpas_user->ID ) ) {
		wp_set_password( $wpas_maya_pass, $wpas_user->ID );
		$wpas_note( 'Maya Chen password' );
	}
	$wpas_users[ $wpas_login ] = (int) $wpas_user->ID;
}

$wpas_products = array(
	array( 'Stoneware Mug', 'HV-MUG-01', '18.00', 24 ),
	array( 'Linen Tea Towel', 'HV-TWL-01', '12.00', 40 ),
	array( 'Beeswax Candle', 'HV-CND-01', '22.00', 18 ),
	array( 'Cold Brew 250 ml', 'HV-CBR-250', '5.50', 60 ),
	array( 'Ceramic Pour-over', 'HV-POV-01', '34.00', 12 ),
	array( 'Oak Serving Board', 'HV-OAK-01', '45.00', 8 ),
	array( 'House Blend Beans 1 lb', 'HV-BNS-1LB', '16.00', 30 ),
	array( 'Enamel Tumbler', 'HV-TMB-01', '24.00', 20 ),
);
foreach ( $wpas_products as list( $wpas_name, $wpas_sku, $wpas_price, $wpas_stock ) ) {
	if ( wc_get_product_id_by_sku( $wpas_sku ) ) {
		continue;
	}
	$wpas_product = new WC_Product_Simple();
	$wpas_product->set_name( $wpas_name );
	$wpas_product->set_sku( $wpas_sku );
	$wpas_product->set_regular_price( $wpas_price );
	$wpas_product->set_manage_stock( true );
	$wpas_product->set_stock_quantity( $wpas_stock );
	$wpas_product->set_status( 'publish' );
	$wpas_product->save();
	$wpas_note( "product $wpas_name" );
}

// Stores and registers go through Pro's own REST API, so the meta is what the store editor writes.
$wpas_rest = static function ( string $method, string $route, array $body = array(), array $query = array() ) {
	$request = new WP_REST_Request( $method, $route );
	$request->set_header( 'X-WCPOS', '1' );
	if ( $query ) {
		$request->set_query_params( $query );
	}
	if ( $body ) {
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_body( wp_json_encode( $body ) );
	}
	$response = rest_do_request( $request );
	if ( $response->is_error() ) {
		WP_CLI::error( "$method $route: " . wp_json_encode( $response->as_error()->get_error_data() ) . ' ' . $response->as_error()->get_error_message() );
	}
	return $response->get_data();
};
$wpas_store_id = static function ( string $name ) {
	$ids = get_posts( array( 'post_type' => 'wcpos_store', 'post_status' => 'any', 'title' => $name, 'fields' => 'ids', 'numberposts' => 1 ) );
	return $ids ? (int) $ids[0] : 0;
};

wp_set_current_user( 1 );
$wpas_week = array();
foreach ( array( '0', '1', '2', '3', '4', '5' ) as $wpas_day ) {
	$wpas_week[ $wpas_day ] = array( '09:00', '17:30' );
}
$wpas_stores = array(
	'Harbour Street'   => array( 'address_1' => '12 Harbour Street', 'city' => 'Portland', 'state' => 'OR', 'postcode' => '97204', 'country' => 'US', 'phone' => '(503) 555-0142', 'email' => 'harbour@example.com', 'url' => 'https://example.com', 'opening_hours' => $wpas_week ),
	'Market Hall'      => array( 'address_1' => '48 Pike Street', 'city' => 'Seattle', 'state' => 'WA', 'postcode' => '98101', 'country' => 'US', 'phone' => '(206) 555-0188', 'email' => 'market@example.com' ),
	'Riverside Pop-up' => array( 'address_1' => '3 River Walk', 'city' => 'Portland', 'state' => 'OR', 'postcode' => '97209', 'country' => 'US' ),
);
$wpas_store_ids = array();
foreach ( $wpas_stores as $wpas_name => $wpas_fields ) {
	$wpas_id = $wpas_store_id( $wpas_name );
	if ( ! $wpas_id ) {
		$wpas_data = $wpas_rest( 'POST', '/wcpos/v1/stores', array_merge( array( 'name' => $wpas_name ), $wpas_fields ) );
		$wpas_id   = (int) $wpas_data['id'];
		$wpas_note( "store $wpas_name" );
	}
	$wpas_store_ids[ $wpas_name ] = $wpas_id;
}

// Registers are read from Pro's repository: the REST list only shows stores the current user is
// on the staff of, and Harbour Street's staff is narrowed to two cashiers at the end. Writes go
// through REST before that narrowing (on a re-run nothing needs writing).
$wpas_harbour        = $wpas_store_ids['Harbour Street'];
$wpas_harbour_tills  = static function () use ( $wpas_harbour ) {
	$rows = apply_filters( 'wcpos_register_repository', null )->list( array( 'store_id' => $wpas_harbour ) );
	usort( $rows, static fn( $a, $b ) => strcmp( (string) ( $a['created_at_gmt'] ?? '' ), (string) ( $b['created_at_gmt'] ?? '' ) ) );
	return $rows;
};
$wpas_registers = $wpas_harbour_tills();
$wpas_names     = wp_list_pluck( $wpas_registers, 'name' );
if ( ! in_array( 'Front counter', $wpas_names, true ) ) {
	if ( ! $wpas_registers ) {
		WP_CLI::error( 'Harbour Street has no register to rename.' );
	}
	$wpas_rest( 'PATCH', '/wcpos/v2/registers/' . $wpas_registers[0]['id'], array( 'name' => 'Front counter', 'default_float' => '150.00' ) );
	$wpas_note( 'register Front counter' );
}
// Café till is saved with its own float: unset, the store editor shows the plugin's 200.00 placeholder.
if ( ! in_array( 'Café till', $wpas_names, true ) ) {
	$wpas_rest( 'POST', '/wcpos/v2/registers', array( 'name' => 'Café till', 'store_id' => $wpas_harbour, 'default_float' => '100.00' ) );
	$wpas_note( 'register Café till (float 100.00)' );
}
foreach ( $wpas_harbour_tills() as $wpas_row ) {
	if ( 'Café till' === $wpas_row['name'] && '100.00' !== number_format( (float) ( $wpas_row['default_float'] ?? 0 ), 2, '.', '' ) ) {
		$wpas_rest( 'PATCH', '/wcpos/v2/registers/' . $wpas_row['id'], array( 'default_float' => '100.00' ) );
		$wpas_note( 'Café till float 100.00' );
	}
}

$wpas_mug = wc_get_product( wc_get_product_id_by_sku( 'HV-MUG-01' ) );
if ( $wpas_mug && ! $wpas_mug->get_meta( '_pos_price_fields_store_' . $wpas_harbour ) ) {
	( new \WCPOS\WooCommercePOSPro\Services\Store_Pricing_Resolver() )->set_prices( $wpas_mug, $wpas_harbour, '16.00', '' );
	$wpas_note( 'Stoneware Mug Harbour Street price' );
}

// Open Front counter as Maya Chen through the sessions API, so the Tills table shows "Open since".
$wpas_front = null;
foreach ( $wpas_harbour_tills() as $wpas_row ) {
	if ( 'Front counter' === $wpas_row['name'] ) {
		$wpas_front = $wpas_row;
	}
}
// Opened at the most recent 09:00 in the site's timezone (yesterday's when today's is still ahead).
$wpas_opened = ( new DateTimeImmutable( 'today 09:00', wp_timezone() ) )->getTimestamp();
if ( $wpas_opened > time() ) {
	$wpas_opened -= DAY_IN_SECONDS;
}
if ( $wpas_front && ! \WCPOS\WooCommercePOSPro\Registers::has_open_session( $wpas_front['id'] ) ) {
	wp_set_current_user( $wpas_users['maya'] );
	$wpas_rest(
		'POST',
		'/wcpos/v2/sessions',
		array(
			'id'            => wp_generate_uuid4(),
			'register_id'   => $wpas_front['id'],
			'opened_at'     => gmdate( 'Y-m-d\TH:i:s\Z', $wpas_opened ),
			'counted_float' => '150.00',
		)
	);
	wp_set_current_user( 1 );
	$wpas_note( 'Front counter session opened by Maya Chen' );
}

// Last: Harbour Street's staff is only Maya Chen and Leo Park.
// The admin is on the list too: Pro shows a store's tills and store prices only to its staff.
$wpas_staff = array( 1, $wpas_users['maya'], $wpas_users['leo'] );
if ( array_map( 'intval', (array) get_post_meta( $wpas_harbour, '_authorized_users', true ) ) !== $wpas_staff ) {
	$wpas_rest( 'PATCH', '/wcpos/v1/stores/' . $wpas_harbour, array( 'authorized_users' => $wpas_staff ) );
	$wpas_note( 'Harbour Street staff' );
}
// Riverside Pop-up is Leo Park's and Priya Nair's (and the admin's, for its store prices), so Maya
// Chen's Choose a store lists two stores: Harbour Street and Market Hall.
$wpas_riverside       = $wpas_store_ids['Riverside Pop-up'];
$wpas_riverside_staff = array( 1, $wpas_users['leo'], $wpas_users['priya'] );
if ( array_map( 'intval', (array) get_post_meta( $wpas_riverside, '_authorized_users', true ) ) !== $wpas_riverside_staff ) {
	$wpas_rest( 'PATCH', '/wcpos/v1/stores/' . $wpas_riverside, array( 'authorized_users' => $wpas_riverside_staff ) );
	$wpas_note( 'Riverside Pop-up staff' );
}

// Hello Dolly is WordPress's sample plugin: a first row of noise in every Plugins shot.
if ( file_exists( WP_PLUGIN_DIR . '/hello.php' ) ) {
	require_once ABSPATH . 'wp-admin/includes/plugin.php';
	require_once ABSPATH . 'wp-admin/includes/file.php';
	$wpas_deleted = delete_plugins( array( 'hello.php' ) );
	if ( true !== $wpas_deleted ) {
		WP_CLI::error( 'Hello Dolly: ' . ( is_wp_error( $wpas_deleted ) ? $wpas_deleted->get_error_message() : 'not deleted' ) );
	}
	$wpas_note( 'Hello Dolly removed' );
}

// Auto-updates on for the free plugin, as a store following the docs has it ("Disable auto-updates").
$wpas_auto = (array) get_site_option( 'auto_update_plugins', array() );
if ( ! in_array( 'woocommerce-pos/woocommerce-pos.php', $wpas_auto, true ) ) {
	$wpas_auto[] = 'woocommerce-pos/woocommerce-pos.php';
	update_site_option( 'auto_update_plugins', array_values( $wpas_auto ) );
	$wpas_note( 'WCPOS auto-updates on' );
}

// Receipts pages. The WCPOS Cloud Print relay stays off on this env: a one-line mu-plugin (loaded
// on every request from now on, and here before the printer is saved) turns its filter off.
$wpas_relay_file = WPMU_PLUGIN_DIR . '/wpas-relay-off.php';
$wpas_relay_code = "<?php // wp-admin-shots: the docs env never contacts the WCPOS Cloud Print relay.\nadd_filter( 'wcpos_cloud_print_relay_enabled', '__return_false' );\n";
if ( ! is_file( $wpas_relay_file ) || file_get_contents( $wpas_relay_file ) !== $wpas_relay_code ) {
	file_put_contents( $wpas_relay_file, $wpas_relay_code );
	$wpas_note( 'mu-plugin wpas-relay-off.php (wcpos_cloud_print_relay_enabled false)' );
}
require_once $wpas_relay_file;

// The gallery's Simple Thermal Receipt (80mm), installed the way Use Template does it, made active.
$wpas_thermal_title = 'Simple Thermal Receipt (80mm)';
$wpas_thermal       = get_posts( array( 'post_type' => 'wcpos_template', 'post_status' => 'publish', 'title' => $wpas_thermal_title, 'fields' => 'ids', 'numberposts' => 1 ) );
$wpas_thermal       = $wpas_thermal ? (int) $wpas_thermal[0] : 0;
if ( ! $wpas_thermal ) {
	$wpas_thermal = (int) $wpas_rest( 'POST', '/wcpos/v1/templates/install', array( 'gallery_key' => 'thermal-simple-80mm' ) )['id'];
	$wpas_note( "template $wpas_thermal_title" );
}
if ( (string) \WCPOS\WooCommercePOS\Templates::get_active_template_id( 'receipt' ) !== (string) $wpas_thermal ) {
	\WCPOS\WooCommercePOS\Templates::set_active_template_id( $wpas_thermal, 'receipt' );
	$wpas_note( "$wpas_thermal_title active" );
}

// Kitchen printer (Star CloudPRNT) and one auto-print rule, through the settings route the Cloud
// Print screen saves with (a full replacement: the current printers and rules are sent back).
$wpas_cp_route = '/wcpos/v2/settings/cloud-print';
$wpas_cp       = $wpas_rest( 'GET', $wpas_cp_route );
$wpas_kitchen  = current( wp_list_filter( $wpas_cp['printers'], array( 'name' => 'Kitchen printer' ) ) );
if ( ! $wpas_kitchen ) {
	$wpas_cp_printers   = $wpas_cp['printers'];
	$wpas_cp_printers[] = array( 'id' => '', 'name' => 'Kitchen printer', 'provider' => 'star-cloudprnt', 'store_id' => 0 );
	$wpas_rest( 'POST', $wpas_cp_route, array( 'printers' => $wpas_cp_printers, 'assignments' => $wpas_cp['assignments'] ) );
	$wpas_note( 'printer Kitchen printer (Star CloudPRNT)' ); // the response's poll token is never printed
	$wpas_cp      = $wpas_rest( 'GET', $wpas_cp_route );
	$wpas_kitchen = current( wp_list_filter( $wpas_cp['printers'], array( 'name' => 'Kitchen printer' ) ) );
}
$wpas_rule = array( 'printer_id' => $wpas_kitchen['id'], 'store_id' => 0, 'scope' => 'pos', 'template_id' => (string) $wpas_thermal, 'copies' => 1, 'trigger' => 'created' );
if ( ! wp_list_filter( $wpas_cp['assignments'], $wpas_rule ) ) {
	$wpas_rest( 'POST', $wpas_cp_route, array( 'printers' => $wpas_cp['printers'], 'assignments' => array_merge( $wpas_cp['assignments'], array( $wpas_rule ) ) ) );
	$wpas_note( 'auto-print rule POS orders → Kitchen printer' );
}

// My Account receipts on, with the active receipt template.
$wpas_general = get_option( 'woocommerce_pos_settings_general', array() );
$wpas_general = is_array( $wpas_general ) ? $wpas_general : array();
if ( true !== ( $wpas_general['storefront_receipt_enabled'] ?? null ) || '' !== ( $wpas_general['storefront_receipt_template'] ?? '' ) ) {
	update_option( 'woocommerce_pos_settings_general', array_merge( $wpas_general, array( 'storefront_receipt_enabled' => true, 'storefront_receipt_template' => '' ) ) );
	$wpas_note( 'storefront receipts on' );
}

WP_CLI::log( 'seed: created ' . count( $wpas_created ) . ( $wpas_created ? ' (' . implode( ', ', $wpas_created ) . ')' : ' (nothing)' ) );
