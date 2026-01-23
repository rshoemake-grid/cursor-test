/**
 * Input Node Editor Component
 * Handles editing of all input node types (GCP Bucket, AWS S3, Pub/Sub, Local FileSystem, Database, Firebase, BigQuery)
 * Follows Single Responsibility Principle - handles input node configuration only
 */
// @ts-nocheck
function stryNS_9fa48() {
  var g = typeof globalThis === 'object' && globalThis && globalThis.Math === Math && globalThis || new Function("return this")();
  var ns = g.__stryker__ || (g.__stryker__ = {});
  if (ns.activeMutant === undefined && g.process && g.process.env && g.process.env.__STRYKER_ACTIVE_MUTANT__) {
    ns.activeMutant = g.process.env.__STRYKER_ACTIVE_MUTANT__;
  }
  function retrieveNS() {
    return ns;
  }
  stryNS_9fa48 = retrieveNS;
  return retrieveNS();
}
stryNS_9fa48();
function stryCov_9fa48() {
  var ns = stryNS_9fa48();
  var cov = ns.mutantCoverage || (ns.mutantCoverage = {
    static: {},
    perTest: {}
  });
  function cover() {
    var c = cov.static;
    if (ns.currentTestId) {
      c = cov.perTest[ns.currentTestId] = cov.perTest[ns.currentTestId] || {};
    }
    var a = arguments;
    for (var i = 0; i < a.length; i++) {
      c[a[i]] = (c[a[i]] || 0) + 1;
    }
  }
  stryCov_9fa48 = cover;
  cover.apply(null, arguments);
}
function stryMutAct_9fa48(id) {
  var ns = stryNS_9fa48();
  function isActive(id) {
    if (ns.activeMutant === id) {
      if (ns.hitCount !== void 0 && ++ns.hitCount > ns.hitLimit) {
        throw new Error('Stryker: Hit count limit reached (' + ns.hitCount + ')');
      }
      return true;
    }
    return false;
  }
  stryMutAct_9fa48 = isActive;
  return isActive(id);
}
import { useRef, useState, useEffect } from 'react';
import { NodeWithData } from '../../types/nodeData';
interface InputNodeEditorProps {
  node: NodeWithData & {
    type: 'gcp_bucket' | 'aws_s3' | 'gcp_pubsub' | 'local_filesystem' | 'database' | 'firebase' | 'bigquery';
  };
  onConfigUpdate: (configField: string, field: string, value: unknown) => void;
}
export default function InputNodeEditor({
  node,
  onConfigUpdate
}: InputNodeEditorProps) {
  if (stryMutAct_9fa48("136")) {
    {}
  } else {
    stryCov_9fa48("136");
    const inputConfig = stryMutAct_9fa48("139") ? node.data.input_config && {} : stryMutAct_9fa48("138") ? false : stryMutAct_9fa48("137") ? true : (stryCov_9fa48("137", "138", "139"), node.data.input_config || {});

    // GCP Bucket & AWS S3 shared refs
    const bucketNameRef = useRef<HTMLInputElement>(null);
    const objectPathRef = useRef<HTMLInputElement>(null);
    const objectKeyRef = useRef<HTMLInputElement>(null);
    const gcpCredentialsRef = useRef<HTMLTextAreaElement>(null);
    const accessKeyIdRef = useRef<HTMLInputElement>(null);
    const secretKeyRef = useRef<HTMLInputElement>(null);
    const regionRef = useRef<HTMLInputElement>(null);

    // GCP Pub/Sub refs
    const projectIdRef = useRef<HTMLInputElement>(null);
    const topicNameRef = useRef<HTMLInputElement>(null);
    const subscriptionNameRef = useRef<HTMLInputElement>(null);

    // Local FileSystem refs
    const filePathRef = useRef<HTMLInputElement>(null);
    const filePatternRef = useRef<HTMLInputElement>(null);

    // Local state for all input fields
    const [bucketNameValue, setBucketNameValue] = useState(stryMutAct_9fa48("140") ? "Stryker was here!" : (stryCov_9fa48("140"), ''));
    const [objectPathValue, setObjectPathValue] = useState(stryMutAct_9fa48("141") ? "Stryker was here!" : (stryCov_9fa48("141"), ''));
    const [gcpCredentialsValue, setGcpCredentialsValue] = useState(stryMutAct_9fa48("142") ? "Stryker was here!" : (stryCov_9fa48("142"), ''));
    const [objectKeyValue, setObjectKeyValue] = useState(stryMutAct_9fa48("143") ? "Stryker was here!" : (stryCov_9fa48("143"), ''));
    const [accessKeyIdValue, setAccessKeyIdValue] = useState(stryMutAct_9fa48("144") ? "Stryker was here!" : (stryCov_9fa48("144"), ''));
    const [secretKeyValue, setSecretKeyValue] = useState(stryMutAct_9fa48("145") ? "Stryker was here!" : (stryCov_9fa48("145"), ''));
    const [regionValue, setRegionValue] = useState(stryMutAct_9fa48("146") ? "" : (stryCov_9fa48("146"), 'us-east-1'));
    const [projectIdValue, setProjectIdValue] = useState(stryMutAct_9fa48("147") ? "Stryker was here!" : (stryCov_9fa48("147"), ''));
    const [topicNameValue, setTopicNameValue] = useState(stryMutAct_9fa48("148") ? "Stryker was here!" : (stryCov_9fa48("148"), ''));
    const [subscriptionNameValue, setSubscriptionNameValue] = useState(stryMutAct_9fa48("149") ? "Stryker was here!" : (stryCov_9fa48("149"), ''));
    const [filePathValue, setFilePathValue] = useState(stryMutAct_9fa48("150") ? "Stryker was here!" : (stryCov_9fa48("150"), ''));
    const [filePatternValue, setFilePatternValue] = useState(stryMutAct_9fa48("151") ? "Stryker was here!" : (stryCov_9fa48("151"), ''));
    const [modeValue, setModeValue] = useState(stryMutAct_9fa48("152") ? "" : (stryCov_9fa48("152"), 'read'));
    const [overwriteValue, setOverwriteValue] = useState(stryMutAct_9fa48("153") ? false : (stryCov_9fa48("153"), true));

    // Sync local state with node data
    useEffect(() => {
      if (stryMutAct_9fa48("154")) {
        {}
      } else {
        stryCov_9fa48("154");
        if (stryMutAct_9fa48("157") ? document.activeElement === bucketNameRef.current : stryMutAct_9fa48("156") ? false : stryMutAct_9fa48("155") ? true : (stryCov_9fa48("155", "156", "157"), document.activeElement !== bucketNameRef.current)) {
          if (stryMutAct_9fa48("158")) {
            {}
          } else {
            stryCov_9fa48("158");
            setBucketNameValue(stryMutAct_9fa48("161") ? inputConfig.bucket_name && '' : stryMutAct_9fa48("160") ? false : stryMutAct_9fa48("159") ? true : (stryCov_9fa48("159", "160", "161"), inputConfig.bucket_name || (stryMutAct_9fa48("162") ? "Stryker was here!" : (stryCov_9fa48("162"), ''))));
          }
        }
        if (stryMutAct_9fa48("165") ? document.activeElement === objectPathRef.current : stryMutAct_9fa48("164") ? false : stryMutAct_9fa48("163") ? true : (stryCov_9fa48("163", "164", "165"), document.activeElement !== objectPathRef.current)) {
          if (stryMutAct_9fa48("166")) {
            {}
          } else {
            stryCov_9fa48("166");
            setObjectPathValue(stryMutAct_9fa48("169") ? inputConfig.object_path && '' : stryMutAct_9fa48("168") ? false : stryMutAct_9fa48("167") ? true : (stryCov_9fa48("167", "168", "169"), inputConfig.object_path || (stryMutAct_9fa48("170") ? "Stryker was here!" : (stryCov_9fa48("170"), ''))));
          }
        }
        if (stryMutAct_9fa48("173") ? document.activeElement === gcpCredentialsRef.current : stryMutAct_9fa48("172") ? false : stryMutAct_9fa48("171") ? true : (stryCov_9fa48("171", "172", "173"), document.activeElement !== gcpCredentialsRef.current)) {
          if (stryMutAct_9fa48("174")) {
            {}
          } else {
            stryCov_9fa48("174");
            setGcpCredentialsValue(stryMutAct_9fa48("177") ? inputConfig.credentials && '' : stryMutAct_9fa48("176") ? false : stryMutAct_9fa48("175") ? true : (stryCov_9fa48("175", "176", "177"), inputConfig.credentials || (stryMutAct_9fa48("178") ? "Stryker was here!" : (stryCov_9fa48("178"), ''))));
          }
        }
        if (stryMutAct_9fa48("181") ? document.activeElement === objectKeyRef.current : stryMutAct_9fa48("180") ? false : stryMutAct_9fa48("179") ? true : (stryCov_9fa48("179", "180", "181"), document.activeElement !== objectKeyRef.current)) {
          if (stryMutAct_9fa48("182")) {
            {}
          } else {
            stryCov_9fa48("182");
            setObjectKeyValue(stryMutAct_9fa48("185") ? inputConfig.object_key && '' : stryMutAct_9fa48("184") ? false : stryMutAct_9fa48("183") ? true : (stryCov_9fa48("183", "184", "185"), inputConfig.object_key || (stryMutAct_9fa48("186") ? "Stryker was here!" : (stryCov_9fa48("186"), ''))));
          }
        }
        if (stryMutAct_9fa48("189") ? document.activeElement === accessKeyIdRef.current : stryMutAct_9fa48("188") ? false : stryMutAct_9fa48("187") ? true : (stryCov_9fa48("187", "188", "189"), document.activeElement !== accessKeyIdRef.current)) {
          if (stryMutAct_9fa48("190")) {
            {}
          } else {
            stryCov_9fa48("190");
            setAccessKeyIdValue(stryMutAct_9fa48("193") ? inputConfig.access_key_id && '' : stryMutAct_9fa48("192") ? false : stryMutAct_9fa48("191") ? true : (stryCov_9fa48("191", "192", "193"), inputConfig.access_key_id || (stryMutAct_9fa48("194") ? "Stryker was here!" : (stryCov_9fa48("194"), ''))));
          }
        }
        if (stryMutAct_9fa48("197") ? document.activeElement === secretKeyRef.current : stryMutAct_9fa48("196") ? false : stryMutAct_9fa48("195") ? true : (stryCov_9fa48("195", "196", "197"), document.activeElement !== secretKeyRef.current)) {
          if (stryMutAct_9fa48("198")) {
            {}
          } else {
            stryCov_9fa48("198");
            setSecretKeyValue(stryMutAct_9fa48("201") ? inputConfig.secret_access_key && '' : stryMutAct_9fa48("200") ? false : stryMutAct_9fa48("199") ? true : (stryCov_9fa48("199", "200", "201"), inputConfig.secret_access_key || (stryMutAct_9fa48("202") ? "Stryker was here!" : (stryCov_9fa48("202"), ''))));
          }
        }
        if (stryMutAct_9fa48("205") ? document.activeElement === regionRef.current : stryMutAct_9fa48("204") ? false : stryMutAct_9fa48("203") ? true : (stryCov_9fa48("203", "204", "205"), document.activeElement !== regionRef.current)) {
          if (stryMutAct_9fa48("206")) {
            {}
          } else {
            stryCov_9fa48("206");
            setRegionValue(stryMutAct_9fa48("209") ? inputConfig.region && 'us-east-1' : stryMutAct_9fa48("208") ? false : stryMutAct_9fa48("207") ? true : (stryCov_9fa48("207", "208", "209"), inputConfig.region || (stryMutAct_9fa48("210") ? "" : (stryCov_9fa48("210"), 'us-east-1'))));
          }
        }
        if (stryMutAct_9fa48("213") ? document.activeElement === projectIdRef.current : stryMutAct_9fa48("212") ? false : stryMutAct_9fa48("211") ? true : (stryCov_9fa48("211", "212", "213"), document.activeElement !== projectIdRef.current)) {
          if (stryMutAct_9fa48("214")) {
            {}
          } else {
            stryCov_9fa48("214");
            setProjectIdValue(stryMutAct_9fa48("217") ? inputConfig.project_id && '' : stryMutAct_9fa48("216") ? false : stryMutAct_9fa48("215") ? true : (stryCov_9fa48("215", "216", "217"), inputConfig.project_id || (stryMutAct_9fa48("218") ? "Stryker was here!" : (stryCov_9fa48("218"), ''))));
          }
        }
        if (stryMutAct_9fa48("221") ? document.activeElement === topicNameRef.current : stryMutAct_9fa48("220") ? false : stryMutAct_9fa48("219") ? true : (stryCov_9fa48("219", "220", "221"), document.activeElement !== topicNameRef.current)) {
          if (stryMutAct_9fa48("222")) {
            {}
          } else {
            stryCov_9fa48("222");
            setTopicNameValue(stryMutAct_9fa48("225") ? inputConfig.topic_name && '' : stryMutAct_9fa48("224") ? false : stryMutAct_9fa48("223") ? true : (stryCov_9fa48("223", "224", "225"), inputConfig.topic_name || (stryMutAct_9fa48("226") ? "Stryker was here!" : (stryCov_9fa48("226"), ''))));
          }
        }
        if (stryMutAct_9fa48("229") ? document.activeElement === subscriptionNameRef.current : stryMutAct_9fa48("228") ? false : stryMutAct_9fa48("227") ? true : (stryCov_9fa48("227", "228", "229"), document.activeElement !== subscriptionNameRef.current)) {
          if (stryMutAct_9fa48("230")) {
            {}
          } else {
            stryCov_9fa48("230");
            setSubscriptionNameValue(stryMutAct_9fa48("233") ? inputConfig.subscription_name && '' : stryMutAct_9fa48("232") ? false : stryMutAct_9fa48("231") ? true : (stryCov_9fa48("231", "232", "233"), inputConfig.subscription_name || (stryMutAct_9fa48("234") ? "Stryker was here!" : (stryCov_9fa48("234"), ''))));
          }
        }
        if (stryMutAct_9fa48("237") ? document.activeElement === filePathRef.current : stryMutAct_9fa48("236") ? false : stryMutAct_9fa48("235") ? true : (stryCov_9fa48("235", "236", "237"), document.activeElement !== filePathRef.current)) {
          if (stryMutAct_9fa48("238")) {
            {}
          } else {
            stryCov_9fa48("238");
            setFilePathValue(stryMutAct_9fa48("241") ? inputConfig.file_path && '' : stryMutAct_9fa48("240") ? false : stryMutAct_9fa48("239") ? true : (stryCov_9fa48("239", "240", "241"), inputConfig.file_path || (stryMutAct_9fa48("242") ? "Stryker was here!" : (stryCov_9fa48("242"), ''))));
          }
        }
        if (stryMutAct_9fa48("245") ? document.activeElement === filePatternRef.current : stryMutAct_9fa48("244") ? false : stryMutAct_9fa48("243") ? true : (stryCov_9fa48("243", "244", "245"), document.activeElement !== filePatternRef.current)) {
          if (stryMutAct_9fa48("246")) {
            {}
          } else {
            stryCov_9fa48("246");
            setFilePatternValue(stryMutAct_9fa48("249") ? inputConfig.file_pattern && '' : stryMutAct_9fa48("248") ? false : stryMutAct_9fa48("247") ? true : (stryCov_9fa48("247", "248", "249"), inputConfig.file_pattern || (stryMutAct_9fa48("250") ? "Stryker was here!" : (stryCov_9fa48("250"), ''))));
          }
        }
        setModeValue(stryMutAct_9fa48("253") ? inputConfig.mode && 'read' : stryMutAct_9fa48("252") ? false : stryMutAct_9fa48("251") ? true : (stryCov_9fa48("251", "252", "253"), inputConfig.mode || (stryMutAct_9fa48("254") ? "" : (stryCov_9fa48("254"), 'read'))));
        setOverwriteValue(stryMutAct_9fa48("255") ? inputConfig.overwrite && true : (stryCov_9fa48("255"), inputConfig.overwrite ?? (stryMutAct_9fa48("256") ? false : (stryCov_9fa48("256"), true))));
      }
    }, stryMutAct_9fa48("257") ? [] : (stryCov_9fa48("257"), [inputConfig]));

    // GCP Bucket Configuration
    if (stryMutAct_9fa48("260") ? node.type !== 'gcp_bucket' : stryMutAct_9fa48("259") ? false : stryMutAct_9fa48("258") ? true : (stryCov_9fa48("258", "259", "260"), node.type === (stryMutAct_9fa48("261") ? "" : (stryCov_9fa48("261"), 'gcp_bucket')))) {
      if (stryMutAct_9fa48("262")) {
        {}
      } else {
        stryCov_9fa48("262");
        return <div className="border-t pt-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">GCP Bucket Configuration</h4>
        <div className="mb-3">
          <label htmlFor="gcp-bucket-mode" className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
          <select id="gcp-bucket-mode" value={modeValue} onChange={e => {
              if (stryMutAct_9fa48("263")) {
                {}
              } else {
                stryCov_9fa48("263");
                const newValue = e.target.value;
                setModeValue(newValue);
                onConfigUpdate(stryMutAct_9fa48("264") ? "" : (stryCov_9fa48("264"), 'input_config'), stryMutAct_9fa48("265") ? "" : (stryCov_9fa48("265"), 'mode'), newValue);
              }
            }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" aria-label="Select bucket operation mode">
            <option value="read">Read from bucket</option>
            <option value="write">Write to bucket</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Read: Fetch data from bucket. Write: Save data to bucket.
          </p>
        </div>
        <div>
          <label htmlFor="gcp-bucket-name" className="block text-sm font-medium text-gray-700 mb-1">Bucket Name</label>
          <input id="gcp-bucket-name" ref={bucketNameRef} type="text" value={bucketNameValue} onChange={e => {
              if (stryMutAct_9fa48("266")) {
                {}
              } else {
                stryCov_9fa48("266");
                const newValue = e.target.value;
                setBucketNameValue(newValue);
                onConfigUpdate(stryMutAct_9fa48("267") ? "" : (stryCov_9fa48("267"), 'input_config'), stryMutAct_9fa48("268") ? "" : (stryCov_9fa48("268"), 'bucket_name'), newValue);
              }
            }} placeholder="my-bucket-name" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" aria-label="GCP bucket name" />
        </div>
        <div className="mt-3">
          <label htmlFor="gcp-object-path" className="block text-sm font-medium text-gray-700 mb-1">Object Path</label>
          <input id="gcp-object-path" ref={objectPathRef} type="text" value={objectPathValue} onChange={e => {
              if (stryMutAct_9fa48("269")) {
                {}
              } else {
                stryCov_9fa48("269");
                const newValue = e.target.value;
                setObjectPathValue(newValue);
                onConfigUpdate(stryMutAct_9fa48("270") ? "" : (stryCov_9fa48("270"), 'input_config'), stryMutAct_9fa48("271") ? "" : (stryCov_9fa48("271"), 'object_path'), newValue);
              }
            }} placeholder="path/to/file.txt or leave blank for all objects" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" aria-label="Object path in bucket" />
        </div>
        <div className="mt-3">
          <label htmlFor="gcp-credentials" className="block text-sm font-medium text-gray-700 mb-1">GCP Credentials (JSON)</label>
          <textarea id="gcp-credentials" ref={gcpCredentialsRef} value={gcpCredentialsValue} onChange={e => {
              if (stryMutAct_9fa48("272")) {
                {}
              } else {
                stryCov_9fa48("272");
                const newValue = e.target.value;
                setGcpCredentialsValue(newValue);
                onConfigUpdate(stryMutAct_9fa48("273") ? "" : (stryCov_9fa48("273"), 'input_config'), stryMutAct_9fa48("274") ? "" : (stryCov_9fa48("274"), 'credentials'), newValue);
              }
            }} rows={3} placeholder="Paste GCP service account JSON credentials" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-primary-500" aria-label="GCP service account credentials" />
          <p className="text-xs text-gray-500 mt-1">
            Service account JSON credentials for GCP access
          </p>
        </div>
      </div>;
      }
    }

    // AWS S3 Configuration
    if (stryMutAct_9fa48("277") ? node.type !== 'aws_s3' : stryMutAct_9fa48("276") ? false : stryMutAct_9fa48("275") ? true : (stryCov_9fa48("275", "276", "277"), node.type === (stryMutAct_9fa48("278") ? "" : (stryCov_9fa48("278"), 'aws_s3')))) {
      if (stryMutAct_9fa48("279")) {
        {}
      } else {
        stryCov_9fa48("279");
        return <div className="border-t pt-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">AWS S3 Configuration</h4>
        <div className="mb-3">
          <label htmlFor="aws-s3-mode" className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
          <select id="aws-s3-mode" value={modeValue} onChange={e => {
              if (stryMutAct_9fa48("280")) {
                {}
              } else {
                stryCov_9fa48("280");
                const newValue = e.target.value;
                setModeValue(newValue);
                onConfigUpdate(stryMutAct_9fa48("281") ? "" : (stryCov_9fa48("281"), 'input_config'), stryMutAct_9fa48("282") ? "" : (stryCov_9fa48("282"), 'mode'), newValue);
              }
            }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" aria-label="Select S3 operation mode">
            <option value="read">Read from bucket</option>
            <option value="write">Write to bucket</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Read: Fetch data from bucket. Write: Save data to bucket.
          </p>
        </div>
        <div>
          <label htmlFor="aws-bucket-name" className="block text-sm font-medium text-gray-700 mb-1">Bucket Name</label>
          <input id="aws-bucket-name" ref={bucketNameRef} type="text" value={bucketNameValue} onChange={e => {
              if (stryMutAct_9fa48("283")) {
                {}
              } else {
                stryCov_9fa48("283");
                const newValue = e.target.value;
                setBucketNameValue(newValue);
                onConfigUpdate(stryMutAct_9fa48("284") ? "" : (stryCov_9fa48("284"), 'input_config'), stryMutAct_9fa48("285") ? "" : (stryCov_9fa48("285"), 'bucket_name'), newValue);
              }
            }} placeholder="my-bucket-name" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" aria-label="AWS S3 bucket name" />
        </div>
        <div className="mt-3">
          <label htmlFor="aws-object-key" className="block text-sm font-medium text-gray-700 mb-1">Object Key</label>
          <input id="aws-object-key" ref={objectKeyRef} type="text" value={objectKeyValue} onChange={e => {
              if (stryMutAct_9fa48("286")) {
                {}
              } else {
                stryCov_9fa48("286");
                const newValue = e.target.value;
                setObjectKeyValue(newValue);
                onConfigUpdate(stryMutAct_9fa48("287") ? "" : (stryCov_9fa48("287"), 'input_config'), stryMutAct_9fa48("288") ? "" : (stryCov_9fa48("288"), 'object_key'), newValue);
              }
            }} placeholder="path/to/file.txt or leave blank for all objects" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" aria-label="S3 object key" />
        </div>
        <div className="mt-3">
          <label htmlFor="aws-access-key-id" className="block text-sm font-medium text-gray-700 mb-1">AWS Access Key ID</label>
          <input id="aws-access-key-id" ref={accessKeyIdRef} type="text" value={accessKeyIdValue} onChange={e => {
              if (stryMutAct_9fa48("289")) {
                {}
              } else {
                stryCov_9fa48("289");
                const newValue = e.target.value;
                setAccessKeyIdValue(newValue);
                onConfigUpdate(stryMutAct_9fa48("290") ? "" : (stryCov_9fa48("290"), 'input_config'), stryMutAct_9fa48("291") ? "" : (stryCov_9fa48("291"), 'access_key_id'), newValue);
              }
            }} placeholder="AKIAIOSFODNN7EXAMPLE" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" aria-label="AWS access key ID" />
        </div>
        <div className="mt-3">
          <label htmlFor="aws-secret-key" className="block text-sm font-medium text-gray-700 mb-1">AWS Secret Access Key</label>
          <input id="aws-secret-key" ref={secretKeyRef} type="password" value={secretKeyValue} onChange={e => {
              if (stryMutAct_9fa48("292")) {
                {}
              } else {
                stryCov_9fa48("292");
                const newValue = e.target.value;
                setSecretKeyValue(newValue);
                onConfigUpdate(stryMutAct_9fa48("293") ? "" : (stryCov_9fa48("293"), 'input_config'), stryMutAct_9fa48("294") ? "" : (stryCov_9fa48("294"), 'secret_access_key'), newValue);
              }
            }} placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" aria-label="AWS secret access key" />
        </div>
        <div className="mt-3">
          <label htmlFor="aws-region" className="block text-sm font-medium text-gray-700 mb-1">AWS Region</label>
          <input id="aws-region" ref={regionRef} type="text" value={regionValue} onChange={e => {
              if (stryMutAct_9fa48("295")) {
                {}
              } else {
                stryCov_9fa48("295");
                const newValue = e.target.value;
                setRegionValue(newValue);
                onConfigUpdate(stryMutAct_9fa48("296") ? "" : (stryCov_9fa48("296"), 'input_config'), stryMutAct_9fa48("297") ? "" : (stryCov_9fa48("297"), 'region'), newValue);
              }
            }} placeholder="us-east-1" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" aria-label="AWS region" />
        </div>
      </div>;
      }
    }

    // GCP Pub/Sub Configuration
    if (stryMutAct_9fa48("300") ? node.type !== 'gcp_pubsub' : stryMutAct_9fa48("299") ? false : stryMutAct_9fa48("298") ? true : (stryCov_9fa48("298", "299", "300"), node.type === (stryMutAct_9fa48("301") ? "" : (stryCov_9fa48("301"), 'gcp_pubsub')))) {
      if (stryMutAct_9fa48("302")) {
        {}
      } else {
        stryCov_9fa48("302");
        return <div className="border-t pt-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">GCP Pub/Sub Configuration</h4>
        <div className="mb-3">
          <label htmlFor="pubsub-mode" className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
          <select id="pubsub-mode" value={modeValue} onChange={e => {
              if (stryMutAct_9fa48("303")) {
                {}
              } else {
                stryCov_9fa48("303");
                const newValue = e.target.value;
                setModeValue(newValue);
                onConfigUpdate(stryMutAct_9fa48("304") ? "" : (stryCov_9fa48("304"), 'input_config'), stryMutAct_9fa48("305") ? "" : (stryCov_9fa48("305"), 'mode'), newValue);
              }
            }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" aria-label="Select Pub/Sub operation mode">
            <option value="read">Subscribe (read messages)</option>
            <option value="write">Publish (write messages)</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Subscribe: Receive messages from topic. Publish: Send messages to topic.
          </p>
        </div>
        <div>
          <label htmlFor="pubsub-project-id" className="block text-sm font-medium text-gray-700 mb-1">Project ID</label>
          <input id="pubsub-project-id" ref={projectIdRef} type="text" value={projectIdValue} onChange={e => {
              if (stryMutAct_9fa48("306")) {
                {}
              } else {
                stryCov_9fa48("306");
                const newValue = e.target.value;
                setProjectIdValue(newValue);
                onConfigUpdate(stryMutAct_9fa48("307") ? "" : (stryCov_9fa48("307"), 'input_config'), stryMutAct_9fa48("308") ? "" : (stryCov_9fa48("308"), 'project_id'), newValue);
              }
            }} placeholder="my-gcp-project" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" aria-label="GCP project ID" />
        </div>
        <div className="mt-3">
          <label htmlFor="pubsub-topic-name" className="block text-sm font-medium text-gray-700 mb-1">Topic Name</label>
          <input id="pubsub-topic-name" ref={topicNameRef} type="text" value={topicNameValue} onChange={e => {
              if (stryMutAct_9fa48("309")) {
                {}
              } else {
                stryCov_9fa48("309");
                const newValue = e.target.value;
                setTopicNameValue(newValue);
                onConfigUpdate(stryMutAct_9fa48("310") ? "" : (stryCov_9fa48("310"), 'input_config'), stryMutAct_9fa48("311") ? "" : (stryCov_9fa48("311"), 'topic_name'), newValue);
              }
            }} placeholder="my-topic" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" aria-label="Pub/Sub topic name" />
        </div>
        <div className="mt-3">
          <label htmlFor="pubsub-subscription-name" className="block text-sm font-medium text-gray-700 mb-1">Subscription Name</label>
          <input id="pubsub-subscription-name" ref={subscriptionNameRef} type="text" value={subscriptionNameValue} onChange={e => {
              if (stryMutAct_9fa48("312")) {
                {}
              } else {
                stryCov_9fa48("312");
                const newValue = e.target.value;
                setSubscriptionNameValue(newValue);
                onConfigUpdate(stryMutAct_9fa48("313") ? "" : (stryCov_9fa48("313"), 'input_config'), stryMutAct_9fa48("314") ? "" : (stryCov_9fa48("314"), 'subscription_name'), newValue);
              }
            }} placeholder="my-subscription" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" aria-label="Pub/Sub subscription name" />
        </div>
        <div className="mt-3">
          <label htmlFor="pubsub-credentials" className="block text-sm font-medium text-gray-700 mb-1">GCP Credentials (JSON)</label>
          <textarea id="pubsub-credentials" ref={gcpCredentialsRef} value={gcpCredentialsValue} onChange={e => {
              if (stryMutAct_9fa48("315")) {
                {}
              } else {
                stryCov_9fa48("315");
                const newValue = e.target.value;
                setGcpCredentialsValue(newValue);
                onConfigUpdate(stryMutAct_9fa48("316") ? "" : (stryCov_9fa48("316"), 'input_config'), stryMutAct_9fa48("317") ? "" : (stryCov_9fa48("317"), 'credentials'), newValue);
              }
            }} rows={3} placeholder="Paste GCP service account JSON credentials" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-primary-500" aria-label="GCP service account credentials" />
        </div>
      </div>;
      }
    }

    // Local FileSystem Configuration
    if (stryMutAct_9fa48("320") ? node.type !== 'local_filesystem' : stryMutAct_9fa48("319") ? false : stryMutAct_9fa48("318") ? true : (stryCov_9fa48("318", "319", "320"), node.type === (stryMutAct_9fa48("321") ? "" : (stryCov_9fa48("321"), 'local_filesystem')))) {
      if (stryMutAct_9fa48("322")) {
        {}
      } else {
        stryCov_9fa48("322");
        return <div className="border-t pt-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Local File System Configuration</h4>
        <div className="mb-3">
          <label htmlFor="filesystem-mode" className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
          <select id="filesystem-mode" value={modeValue} onChange={e => {
              if (stryMutAct_9fa48("323")) {
                {}
              } else {
                stryCov_9fa48("323");
                const newValue = e.target.value;
                setModeValue(newValue);
                onConfigUpdate(stryMutAct_9fa48("324") ? "" : (stryCov_9fa48("324"), 'input_config'), stryMutAct_9fa48("325") ? "" : (stryCov_9fa48("325"), 'mode'), newValue);
              }
            }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" aria-label="Select file system operation mode">
            <option value="read">Read from file</option>
            <option value="write">Write to file</option>
          </select>
        </div>
        <div>
          <label htmlFor="filesystem-path" className="block text-sm font-medium text-gray-700 mb-1">File Path</label>
          <input id="filesystem-path" ref={filePathRef} type="text" value={filePathValue} onChange={e => {
              if (stryMutAct_9fa48("326")) {
                {}
              } else {
                stryCov_9fa48("326");
                const newValue = e.target.value;
                setFilePathValue(newValue);
                onConfigUpdate(stryMutAct_9fa48("327") ? "" : (stryCov_9fa48("327"), 'input_config'), stryMutAct_9fa48("328") ? "" : (stryCov_9fa48("328"), 'file_path'), newValue);
              }
            }} placeholder="/path/to/file.txt" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" aria-label="File system path" />
        </div>
        {stryMutAct_9fa48("331") ? modeValue === 'read' || <div className="mt-3">
            <label htmlFor="filesystem-pattern" className="block text-sm font-medium text-gray-700 mb-1">File Pattern (optional)</label>
            <input id="filesystem-pattern" ref={filePatternRef} type="text" value={filePatternValue} onChange={e => {
              const newValue = e.target.value;
              setFilePatternValue(newValue);
              onConfigUpdate('input_config', 'file_pattern', newValue);
            }} placeholder="*.txt or leave blank for exact match" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" aria-label="File pattern for matching" />
          </div> : stryMutAct_9fa48("330") ? false : stryMutAct_9fa48("329") ? true : (stryCov_9fa48("329", "330", "331"), (stryMutAct_9fa48("333") ? modeValue !== 'read' : stryMutAct_9fa48("332") ? true : (stryCov_9fa48("332", "333"), modeValue === (stryMutAct_9fa48("334") ? "" : (stryCov_9fa48("334"), 'read')))) && <div className="mt-3">
            <label htmlFor="filesystem-pattern" className="block text-sm font-medium text-gray-700 mb-1">File Pattern (optional)</label>
            <input id="filesystem-pattern" ref={filePatternRef} type="text" value={filePatternValue} onChange={e => {
              if (stryMutAct_9fa48("335")) {
                {}
              } else {
                stryCov_9fa48("335");
                const newValue = e.target.value;
                setFilePatternValue(newValue);
                onConfigUpdate(stryMutAct_9fa48("336") ? "" : (stryCov_9fa48("336"), 'input_config'), stryMutAct_9fa48("337") ? "" : (stryCov_9fa48("337"), 'file_pattern'), newValue);
              }
            }} placeholder="*.txt or leave blank for exact match" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" aria-label="File pattern for matching" />
          </div>)}
        {stryMutAct_9fa48("340") ? modeValue === 'write' || <div className="mt-3">
            <label htmlFor="filesystem-overwrite" className="flex items-center gap-2">
              <input id="filesystem-overwrite" type="checkbox" checked={overwriteValue} onChange={e => {
                const newValue = e.target.checked;
                setOverwriteValue(newValue);
                onConfigUpdate('input_config', 'overwrite', newValue);
              }} className="w-4 h-4" aria-label="Overwrite existing file" />
              <span className="text-sm font-medium text-gray-700">Overwrite existing file</span>
            </label>
          </div> : stryMutAct_9fa48("339") ? false : stryMutAct_9fa48("338") ? true : (stryCov_9fa48("338", "339", "340"), (stryMutAct_9fa48("342") ? modeValue !== 'write' : stryMutAct_9fa48("341") ? true : (stryCov_9fa48("341", "342"), modeValue === (stryMutAct_9fa48("343") ? "" : (stryCov_9fa48("343"), 'write')))) && <div className="mt-3">
            <label htmlFor="filesystem-overwrite" className="flex items-center gap-2">
              <input id="filesystem-overwrite" type="checkbox" checked={overwriteValue} onChange={e => {
                if (stryMutAct_9fa48("344")) {
                  {}
                } else {
                  stryCov_9fa48("344");
                  const newValue = e.target.checked;
                  setOverwriteValue(newValue);
                  onConfigUpdate(stryMutAct_9fa48("345") ? "" : (stryCov_9fa48("345"), 'input_config'), stryMutAct_9fa48("346") ? "" : (stryCov_9fa48("346"), 'overwrite'), newValue);
                }
              }} className="w-4 h-4" aria-label="Overwrite existing file" />
              <span className="text-sm font-medium text-gray-700">Overwrite existing file</span>
            </label>
          </div>)}
      </div>;
      }
    }

    // Database, Firebase, and BigQuery are more complex - return simplified version for now
    // These can be extracted into separate components later if needed
    return <div className="border-t pt-4">
      <h4 className="text-sm font-semibold text-gray-900 mb-3">
        {stryMutAct_9fa48("349") ? node.type === 'database' || 'Database Configuration' : stryMutAct_9fa48("348") ? false : stryMutAct_9fa48("347") ? true : (stryCov_9fa48("347", "348", "349"), (stryMutAct_9fa48("351") ? node.type !== 'database' : stryMutAct_9fa48("350") ? true : (stryCov_9fa48("350", "351"), node.type === (stryMutAct_9fa48("352") ? "" : (stryCov_9fa48("352"), 'database')))) && (stryMutAct_9fa48("353") ? "" : (stryCov_9fa48("353"), 'Database Configuration')))}
        {stryMutAct_9fa48("356") ? node.type === 'firebase' || 'Firebase Configuration' : stryMutAct_9fa48("355") ? false : stryMutAct_9fa48("354") ? true : (stryCov_9fa48("354", "355", "356"), (stryMutAct_9fa48("358") ? node.type !== 'firebase' : stryMutAct_9fa48("357") ? true : (stryCov_9fa48("357", "358"), node.type === (stryMutAct_9fa48("359") ? "" : (stryCov_9fa48("359"), 'firebase')))) && (stryMutAct_9fa48("360") ? "" : (stryCov_9fa48("360"), 'Firebase Configuration')))}
        {stryMutAct_9fa48("363") ? node.type === 'bigquery' || 'BigQuery Configuration' : stryMutAct_9fa48("362") ? false : stryMutAct_9fa48("361") ? true : (stryCov_9fa48("361", "362", "363"), (stryMutAct_9fa48("365") ? node.type !== 'bigquery' : stryMutAct_9fa48("364") ? true : (stryCov_9fa48("364", "365"), node.type === (stryMutAct_9fa48("366") ? "" : (stryCov_9fa48("366"), 'bigquery')))) && (stryMutAct_9fa48("367") ? "" : (stryCov_9fa48("367"), 'BigQuery Configuration')))}
      </h4>
      <p className="text-xs text-gray-500">
        Configuration for {node.type} nodes is handled in PropertyPanel. 
        Consider extracting to a separate component for better organization.
      </p>
    </div>;
  }
}