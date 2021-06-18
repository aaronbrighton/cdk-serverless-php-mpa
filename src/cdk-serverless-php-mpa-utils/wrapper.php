<?php
require getenv('BREF_AUTOLOAD_PATH');
use GuzzleHttp\Psr7\MimeType;
use Aws\SecretsManager\SecretsManagerClient;

$ru=$_SERVER['REQUEST_URI'];
$ltr=getenv('LAMBDA_TASK_ROOT');
$spif=getenv('SERVERLESS_PHP_MPA_INDEX_FILE');
$sprf=getenv('SERVERLESS_PHP_MPA_REWRITE_FILE');

$ftl = strtok($ltr.'/public_html'.$ru, '?');
$ftl = is_dir($ftl) ? rtrim($ftl, '/').'/'.$spif : $ftl;
$ftlinfo = pathinfo($ftl);

if ((!file_exists($ftl) || !isset($ftlinfo['filename'])) && $sprf) {
    $ftl = $ltr.'/public_html'.$sprf;
    $ftlinfo = pathinfo($ftl);
}

if (file_exists($ftl) && isset($ftlinfo['filename'])) {
    if (isset($ftlinfo['extension']) && $ftlinfo['extension'] === 'php') {
        if (isset($_ENV['RDS_SECRET_INJECT']))
        {
            $GLOBALS['RDS_CREDS'] = apcu_entry("RDS_CREDS", function ($key) {
                $client = new SecretsManagerClient([
                    'version' => 'latest',
                    'region' => $_ENV['AWS_REGION'],
                ]);
                $secret = json_decode($client->getSecretValue([
                    'SecretId' => $_ENV['RDS_SECRET_ARN'],
                ])['SecretString']);
                return [
                    'RDS_USERNAME' => $secret->username,
                    'RDS_PASSWORD' => $secret->password,
                    'RDS_HOST' => $secret->host,
                    'RDS_DATABASE' => $secret->dbname
                ];
            });

            if (isset($_ENV['RDS_LOADER']) && (!isset($_SERVER['HTTP_X_REQUESTED_WITH']) || strcasecmp($_SERVER['HTTP_X_REQUESTED_WITH'], 'xmlhttprequest') !== 0))
            {
                $connection = mysqli_init();
                $connection->options(MYSQLI_OPT_CONNECT_TIMEOUT, 1);
                $connection->options(MYSQLI_OPT_READ_TIMEOUT, 1);
                $connection->real_connect($GLOBALS['RDS_CREDS']['RDS_HOST'],$GLOBALS['RDS_CREDS']['RDS_USERNAME'],$GLOBALS['RDS_CREDS']['RDS_PASSWORD'],$GLOBALS['RDS_CREDS']['RDS_DATABASE']);
                if ($connection -> connect_errno)
                {
                    //header("Cache-Control: no-cache"); // HTTP/1.1
                    http_response_code(503);
                    header("Retry-After: 2");
                    echo '<meta http-equiv="refresh" content="5">';
                    echo $_ENV['RDS_LOADER_MESSAGE'];
                    exit();
                }
                else
                {
                    $connection->close();
                }
            }
        }
        chdir($ftlinfo['dirname']);
        $_SERVER['SCRIPT_FILENAME'] = $ftl;
        require($ftl);
    } else {
        header("Content-Type: " . MimeType::fromFilename($ftl) ?: 'text/plain');
        header("Content-Length: " . filesize($ftl));
        $fp = fopen($ftl, 'rb');
        fpassthru($fp);
    }
} else {
    http_response_code(403);
    echo "403 not found!";
}