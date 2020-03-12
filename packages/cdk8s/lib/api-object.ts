import { Construct } from 'constructs';
import { Chart } from './chart';
import { removeEmpty } from './_util';
import { resolve } from './_tokens';
import * as stringify from 'json-stable-stringify';

/**
 * Metadata associated with this object.
 */
export interface ApiObjectMetadata {
  /**
   * The unique, namespace-global, name of this object inside the Kubernetes
   * cluster.
   *
   * Normally, you shouldn't specify names for objects and let the CDK generate
   * a name for you that is application-unique. The names CDK generates are
   * composed from the construct path components, separated by dots and a suffix
   * that is based on a hash of the entire path, to ensure uniqueness.
   *
   * You can supply custom name allocation logic by overriding the
   * `chart.generateObjectName` method.
   *
   * If you use an explicit name here, bear in mind that this reduces the
   * composability of your construct because it won't be possible to include
   * more than one instance in any app. Therefore it is highly recommended to
   * leave this unspecified.
   *
   * @default - an app-unique name generated by the chart
   */
  readonly name?: string;

  /**
   * Arbitrary key/value metadata.
   */
  readonly [key: string]: any;
}

/**
 * Options for defining API objects.
 */
export interface ApiObjectOptions {
  /**
   * Data associated with the resource.
   */
  readonly data?: any;

  /**
   * Object metadata.
   *
   * If `name` is not specified, an app-unique name will be allocated by the
   * framework based on the path of the construct within thes construct tree.
   */
  readonly metadata?: ApiObjectMetadata;  

  /**
   * API version.
   */
  readonly apiVersion: string;

  /**
   * Resource kind.
   */
  readonly kind: string;

  /**
   * Additional attributes for this API object.
   */
  readonly [key: string]: any;
}

export class ApiObject extends Construct {

  /**
   * The app-unique name of the object.
   *
   * The name is allocated based on the path of the object construct within the
   * construct tree.
   */
  public readonly name: string;

  /**
   * The object's API version.
   */
  public readonly apiVersion: string;

  /**
   * The object kind.
   */
  public readonly kind: string;

  /**
   * The chart in which this object is defined.
   */
  public readonly chart: Chart;

  /**
   * Defines an API object.
   * 
   * @param scope the construct scope
   * @param ns namespace
   * @param options options
   */
  constructor(scope: Construct, ns: string, private readonly options: ApiObjectOptions) {
    super(scope, ns);
    this.chart = Chart.of(this);
    this.kind = options.kind;
    this.apiVersion = options.apiVersion;
    this.name = options.metadata?.name ?? this.chart.generateObjectName(this);
  }

  /**
   * Renders the object to Kubernetes JSON.
   */
  public toJson(): any {
    const data = {
      ...this.options,
      metadata: {
        namespace: Chart.of(this).namespace,
        ...this.options.metadata,
        name: this.name,
      }
    };

    // convert to "pure data" so, for example, when we convert to yaml these
    // references are not converted to anchors.
    return JSON.parse(stringify(removeEmpty(resolve(this, data))));
  }
}

